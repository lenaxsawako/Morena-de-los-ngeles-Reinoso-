import { Controller, Post, Req, Logger } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { Purchase, PurchaseDocument, PurchaseStatus, PaymentProvider } from '../models/purchase.schema';
import { Book, BookDocument } from '../models/book.schema';
import { User, UserDocument } from '../models/user.schema';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';
import { FailedWebhook, FailedWebhookDocument } from '../models/failed-webhook.schema';
import { RedisStoreService } from '../services/redis-store.service';

const LOCK_TTL = 300_000; // 5min lock for processing
const DONE_TTL = 86_400_000; // 24h idempotency marker
const RETRY_KEY_PREFIX = 'wh:retry:';
const MAX_RETRIES = 3;

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FailedWebhook.name) private failedWebhookModel: Model<FailedWebhookDocument>,
    private eventEmitter: EventEmitter2,
    private redisStore: RedisStoreService,
  ) {}

  @Post('polar')
  @Public()
  async handlePolarWebhook(@Req() req: any) {
    let rawEvent: any;
    let eventId: string;

    try {
      const config = await this.siteConfigModel.findOne().lean().exec();
      const expectedSecret = config?.polar?.webhookSecret?.trim();

      if (expectedSecret) {
        try {
          rawEvent = validateEvent(req.rawBody, req.headers, expectedSecret);
        } catch (err) {
          if (err instanceof WebhookVerificationError) {
            this.logger.warn('Webhook verification failed');
            return { received: true };
          }
          rawEvent = req.body;
        }
      } else {
        rawEvent = req.body;
      }

      eventId = rawEvent?.id || rawEvent?.event_id;
      if (!eventId) {
        this.logger.warn('Webhook missing event id');
        return { received: true };
      }

      // Idempotency — check if already fully processed
      const doneKey = `wh:done:${eventId}`;
      if (await this.redisStore.exists(doneKey)) {
        this.logger.log(`Idempotent skip — event ${eventId} already processed`);
        return { received: true };
      }

      // Acquire processing lock (short TTL so retries can re-acquire if crash)
      const lockKey = `wh:lock:${eventId}`;
      const lockAcquired = await this.redisStore.setnx(lockKey, '1', LOCK_TTL);
      if (!lockAcquired) {
        this.logger.log(`Idempotent skip — event ${eventId} is being processed`);
        return { received: true };
      }

      try {
        await this.processEvent(rawEvent);
        // Mark as fully processed (long TTL)
        await this.redisStore.set(doneKey, '1', DONE_TTL);
      } finally {
        await this.redisStore.del(lockKey);
      }
    } catch (err: any) {
      this.logger.error(`Webhook error: ${err.message}`);

      // Track retries in Redis
      const retryKey = `${RETRY_KEY_PREFIX}${rawEvent?.id || 'unknown'}`;
      const attempts = (await this.redisStore.incr(retryKey));

      if (attempts >= MAX_RETRIES) {
        try {
          await this.failedWebhookModel.create({
            eventId: rawEvent?.id || 'unknown',
            eventType: rawEvent?.type || 'unknown',
            payload: rawEvent || {},
            error: err.message,
            attempts,
          });
          this.logger.warn(`Webhook moved to dead letter — event=${rawEvent?.id} attempts=${attempts}`);
          await this.redisStore.del(retryKey);
        } catch (dlqErr: any) {
          this.logger.error(`Failed to save dead letter: ${dlqErr.message}`);
        }
      }
    }

    return { received: true };
  }

  private async processEvent(event: any) {
    const eventType = event?.type;
    this.logger.log(`Processing Polar webhook: ${eventType}`);

    const data = event?.data;

    if (eventType === 'checkout.updated' && data?.status === 'succeeded') {
      await this.recordPurchase('checkout', data);
    } else if (eventType === 'order.paid') {
      await this.recordPurchase('order', data);
    } else {
      this.logger.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private async recordPurchase(source: string, data: any) {
    const metadata = data?.metadata || {};
    const userId = metadata.userId;
    const bookId = metadata.bookId;

    if (!userId || !bookId) {
      this.logger.warn(`${source} webhook missing userId or bookId`);
      return;
    }

    const id = data?.id;
    if (!id) return;

    // Use MongoDB session for atomic transaction
    const session = await this.purchaseModel.db.startSession();
    session.startTransaction();

    try {
      // Check duplicates within transaction
      const [byOrderId, byUserBook] = await Promise.all([
        this.purchaseModel.findOne({ providerOrderId: id, provider: PaymentProvider.POLAR }).session(session),
        this.purchaseModel.findOne({
          userRef: new Types.ObjectId(userId),
          bookRef: new Types.ObjectId(bookId),
          status: { $in: [PurchaseStatus.PAID, PurchaseStatus.PENDING] },
        }).session(session),
      ]);

      if (byOrderId || byUserBook) {
        this.logger.log(`Duplicate ${source} skipped`);
        await session.abortTransaction();
        return;
      }

      // Create purchase as PENDING
      const [purchase] = await this.purchaseModel.create([{
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
        purchaseToken: id,
        provider: PaymentProvider.POLAR,
        status: PurchaseStatus.PENDING,
        providerOrderId: id,
        amountCents: data?.amount || 0,
        currency: data?.currency || 'USD',
        paidAt: new Date(),
        metadata,
      }], { session });

      // Mark as paid + increment book sales
      await Promise.all([
        this.purchaseModel.findByIdAndUpdate(purchase._id, { status: PurchaseStatus.PAID }, { session }),
        this.bookModel.findByIdAndUpdate(bookId, { $inc: { sales: 1 } }, { session }),
      ]);

      await session.commitTransaction();
      this.logger.log(`Purchase recorded atomically via ${source}: user=${userId}, book=${bookId}`);

      // Emit event outside transaction (non-critical)
      this.emitPurchaseEvent(userId, bookId).catch(err =>
        this.logger.error(`Error emitting purchase event: ${err.message}`),
      );
    } catch (err: any) {
      await session.abortTransaction();
      this.logger.error(`Atomic purchase failed: ${err.message}`);
      throw err;
    } finally {
      session.endSession();
    }
  }

  private async emitPurchaseEvent(userId: string, bookId: string) {
    const [user, book] = await Promise.all([
      this.userModel.findById(userId).select('email').lean(),
      this.bookModel.findById(bookId).select('title coverUrl').lean(),
    ]);
    if (user && book) {
      this.eventEmitter.emit('purchase.completed', {
        email: user.email,
        bookTitle: book.title,
        bookId,
        coverUrl: book.coverUrl,
      });
    }
  }
}
