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

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('polar')
  @Public()
  async handlePolarWebhook(@Req() req: any) {
    try {
      const config = await this.siteConfigModel.findOne().lean().exec();
      const expectedSecret = config?.polar?.webhookSecret?.trim();

      if (expectedSecret) {
        try {
          const event = validateEvent(
            req.rawBody,
            req.headers,
            expectedSecret,
          );
          return await this.processEvent(event);
        } catch (err) {
          if (err instanceof WebhookVerificationError) {
            this.logger.warn('Webhook verification failed');
            return { received: true };
          }
          throw err;
        }
      } else {
        this.logger.debug('No webhook secret configured, skipping validation');
        return await this.processEvent(req.body);
      }
    } catch (err) {
      this.logger.error(`Webhook error: ${err.message}`);
      return { received: true };
    }
  }

  private async processEvent(event: any) {
    const eventType = event?.type;
    this.logger.log(`Received Polar webhook: ${eventType}`);

    const data = event?.data;

    if (eventType === 'checkout.updated' && data?.status === 'succeeded') {
      await this.recordPurchase('checkout', data);
    } else if (eventType === 'order.paid') {
      await this.recordPurchase('order', data);
    } else {
      this.logger.log(`Unhandled webhook event: ${eventType}`);
    }

    return { received: true };
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

    // Check by providerOrderId AND by userRef+bookRef to prevent duplicates
    const [byOrderId, byUserBook] = await Promise.all([
      this.purchaseModel.findOne({ providerOrderId: id, provider: PaymentProvider.POLAR }).exec(),
      this.purchaseModel.findOne({ userRef: new Types.ObjectId(userId), bookRef: new Types.ObjectId(bookId) }).exec(),
    ]);

    if (byOrderId) {
      this.logger.log(`Duplicate ${source} skipped (same providerOrderId)`);
      return;
    }
    if (byUserBook) {
      this.logger.log(`Duplicate ${source} skipped (already purchased)`);
      return;
    }

    await this.purchaseModel.create({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
      purchaseToken: id,
      provider: PaymentProvider.POLAR,
      status: PurchaseStatus.PAID,
      providerOrderId: id,
      amountCents: data?.amount || 0,
      currency: data?.currency || 'USD',
      paidAt: new Date(),
      metadata,
    });

    await this.bookModel.findByIdAndUpdate(bookId, { $inc: { sales: 1 } });
    this.logger.log(`Purchase recorded via ${source}: user=${userId}, book=${bookId}`);

    try {
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
    } catch (err) {
      this.logger.error(`Error emitting purchase event: ${err.message}`);
    }
  }
}
