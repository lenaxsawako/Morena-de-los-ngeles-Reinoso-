import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { User, UserSchema } from '../models/user.schema';
import { SiteConfig, SiteConfigSchema } from '../models/site-config.schema';
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
      { name: User.name, schema: UserSchema },
      { name: SiteConfig.name, schema: SiteConfigSchema },
    ]),
  ],
  controllers: [CheckoutController, WebhookController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
