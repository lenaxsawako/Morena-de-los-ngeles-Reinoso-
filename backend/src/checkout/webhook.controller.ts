import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument, PurchaseStatus, PaymentProvider } from '../models/purchase.schema';
import { Book, BookDocument } from '../models/book.schema';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  @Post('polar')
  @Public()
  async handlePolarWebhook(
    @Body() body: any,
    @Headers('polar-webhook-secret') webhookSecret: string,
  ) {
    try {
      const config = await this.siteConfigModel.findOne().lean().exec();
      const expectedSecret = config?.polar?.webhookSecret;
      if (expectedSecret) {
        if (webhookSecret !== expectedSecret) {
          this.logger.warn(`Invalid polar webhook secret (got first 8: ${webhookSecret?.slice(0, 8)}..., expected first 8: ${expectedSecret.slice(0, 8)}...)`);
          return { received: true };
        }
      } else {
        this.logger.debug('No webhook secret configured, skipping validation');
      }

      const eventType = body?.type;
      this.logger.log(`Received Polar webhook: ${eventType}`);

      if (eventType === 'checkout.completed') {
        const checkout = body.data;
        const metadata = checkout.metadata || {};

        const userId = metadata.userId;
        const bookId = metadata.bookId;

        if (!userId || !bookId) {
          this.logger.warn('Webhook missing userId or bookId in metadata');
          return { received: true };
        }

        // Idempotency check — skip if purchase already recorded
        const existing = await this.purchaseModel.findOne({
          providerOrderId: checkout.id,
          provider: PaymentProvider.POLAR,
        }).exec();
        if (existing) {
          this.logger.log(`Duplicate webhook skipped for checkout ${checkout.id}`);
          return { received: true };
        }

        // Create purchase record
        await this.purchaseModel.create({
          userRef: new Types.ObjectId(userId),
          bookRef: new Types.ObjectId(bookId),
          purchaseToken: checkout.id,
          provider: PaymentProvider.POLAR,
          status: PurchaseStatus.PAID,
          providerOrderId: checkout.id,
          amountCents: checkout.amount || 0,
          currency: checkout.currency || 'USD',
          paidAt: new Date(),
          metadata: { ...metadata, checkoutId: checkout.id },
        });

        // Increment book sales
        await this.bookModel.findByIdAndUpdate(bookId, { $inc: { sales: 1 } });

        this.logger.log(`Purchase recorded: user=${userId}, book=${bookId}`);
      } else if (eventType === 'checkout.created') {
        this.logger.log(`Checkout created: ${body.data?.id}`);
      } else if (eventType === 'order.created' || eventType === 'order.paid') {
        const order = body.data;
        const metadata = order.metadata || {};
        const userId = metadata.userId;
        const bookId = metadata.bookId;

        if (!userId || !bookId) {
          this.logger.warn('Order webhook missing userId or bookId in metadata');
          return { received: true };
        }

        const existing = await this.purchaseModel.findOne({
          providerOrderId: order.id,
          provider: PaymentProvider.POLAR,
        }).exec();
        if (existing) {
          this.logger.log(`Duplicate order webhook skipped for order ${order.id}`);
          return { received: true };
        }

        await this.purchaseModel.create({
          userRef: new Types.ObjectId(userId),
          bookRef: new Types.ObjectId(bookId),
          purchaseToken: order.id,
          provider: PaymentProvider.POLAR,
          status: PurchaseStatus.PAID,
          providerOrderId: order.id,
          amountCents: order.amount || 0,
          currency: order.currency || 'USD',
          paidAt: new Date(),
          metadata: { ...metadata, orderId: order.id },
        });

        await this.bookModel.findByIdAndUpdate(bookId, { $inc: { sales: 1 } });
        this.logger.log(`Purchase recorded via order: user=${userId}, book=${bookId}`);
      } else {
        this.logger.log(`Unhandled webhook event: ${eventType}`);
      }

      return { received: true };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Webhook error: ${err.message}`);
      return { received: true };
    }
  }
}
