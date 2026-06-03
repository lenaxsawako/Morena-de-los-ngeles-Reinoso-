import { Controller, Post, Body, Headers, Req, Logger } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Request } from 'express';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
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
  async handlePolarWebhook(@Req() req: Request) {
    try {
      const config = await this.siteConfigModel.findOne().lean().exec();
      const expectedSecret = config?.polar?.webhookSecret?.trim();

      if (expectedSecret) {
        try {
          const event = validateEvent(
            req.rawBody as Buffer,
            req.headers as Record<string, string>,
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
        const body = req.body as any;
        return await this.processEvent(body);
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

    if (eventType === 'checkout.completed' || eventType === 'order.created' || eventType === 'order.paid') {
      const metadata = data?.metadata || {};
      const userId = metadata.userId;
      const bookId = metadata.bookId;

      if (!userId || !bookId) {
        this.logger.warn(`Webhook ${eventType} missing userId or bookId in metadata`);
        return { received: true };
      }

      const orderId = data?.id;
      if (!orderId) {
        this.logger.warn(`Webhook ${eventType} missing id`);
        return { received: true };
      }

      const existing = await this.purchaseModel.findOne({
        providerOrderId: orderId,
        provider: PaymentProvider.POLAR,
      }).exec();
      if (existing) {
        this.logger.log(`Duplicate webhook skipped for ${orderId}`);
        return { received: true };
      }

      await this.purchaseModel.create({
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
        purchaseToken: orderId,
        provider: PaymentProvider.POLAR,
        status: PurchaseStatus.PAID,
        providerOrderId: orderId,
        amountCents: data?.amount || 0,
        currency: data?.currency || 'USD',
        paidAt: new Date(),
        metadata: { ...metadata, [`${eventType.split('.')[0]}Id`]: orderId },
      });

      await this.bookModel.findByIdAndUpdate(bookId, { $inc: { sales: 1 } });
      this.logger.log(`Purchase recorded via ${eventType}: user=${userId}, book=${bookId}`);
    } else {
      this.logger.log(`Unhandled webhook event: ${eventType}`);
    }

    return { received: true };
  }
}
