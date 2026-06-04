import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from '../models/subscription.schema';
import { SubscriptionService } from './subscription.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterListener } from './newsletter.listener';
import { TemplateService } from './template.service';
import { SubscriptionController } from './subscription.controller';
import { AdminSubscriptionController } from './admin-subscription.controller';
import { EmailModule } from '../emails/email.module';
import { SharedModule } from '../shared/shared.module';
import { NewsletterCampaign, NewsletterCampaignSchema } from '../models/newsletter-campaign.schema';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: NewsletterCampaign.name, schema: NewsletterCampaignSchema },
    ]),
    EmailModule,
  ],
  controllers: [SubscriptionController, AdminSubscriptionController],
  providers: [SubscriptionService, NewsletterService, NewsletterListener, TemplateService],
  exports: [SubscriptionService, NewsletterService, TemplateService],
})
export class SubscriptionModule {}