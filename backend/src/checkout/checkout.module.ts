import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { SharedModule } from '../shared/shared.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
  ],
  controllers: [CheckoutController, WebhookController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
