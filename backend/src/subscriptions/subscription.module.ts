import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from '../models/subscription.schema';
import { SubscriptionService } from './subscription.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterListener } from './newsletter.listener';
import { TemplateService } from './template.service';
import { TransactionalService } from './transactional.service';
import { TransactionalListener } from './transactional.listener';
import { ReadingReminderCron } from './reading-reminder.cron';
import { SupportListener } from './support.listener';
import { SubscriptionController } from './subscription.controller';
import { AdminSubscriptionController } from './admin-subscription.controller';
import { EmailModule } from '../emails/email.module';
import { SharedModule } from '../shared/shared.module';
import { NewsletterCampaign, NewsletterCampaignSchema } from '../models/newsletter-campaign.schema';
import { User, UserSchema } from '../models/user.schema';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { ReadingSession, ReadingSessionSchema } from '../models/reading-session.schema';
import { ReadingProgress, ReadingProgressSchema } from '../models/reading-progress.schema';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: NewsletterCampaign.name, schema: NewsletterCampaignSchema },
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: ReadingSession.name, schema: ReadingSessionSchema },
      { name: ReadingProgress.name, schema: ReadingProgressSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    EmailModule,
  ],
  controllers: [SubscriptionController, AdminSubscriptionController],
  providers: [
    SubscriptionService,
    NewsletterService,
    NewsletterListener,
    TemplateService,
    TransactionalService,
    TransactionalListener,
    ReadingReminderCron,
    SupportListener,
  ],
  exports: [SubscriptionService, NewsletterService, TemplateService, TransactionalService],
})
export class SubscriptionModule {}