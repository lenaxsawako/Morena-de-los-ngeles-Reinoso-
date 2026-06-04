import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscription.schema';
import { NewsletterCampaign, NewsletterCampaignDocument, CampaignStatus, CampaignSegment } from '../models/newsletter-campaign.schema';
import { EmailService } from '../emails/email.service';
import { TemplateService } from './template.service';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(NewsletterCampaign.name) private campaignModel: Model<NewsletterCampaignDocument>,
    private emailService: EmailService,
    private templateService: TemplateService,
  ) {}

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.subscriptionModel.countDocuments(),
      this.subscriptionModel.countDocuments({ isActive: true }),
      this.subscriptionModel.countDocuments({ isActive: false }),
    ]);
    return { totalSubscribers: total, activeSubscribers: active, inactiveSubscribers: inactive };
  }

  async getAllActiveSubscribers(): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find({ isActive: true }).lean();
  }

  async getRecipients(segment: CampaignSegment): Promise<string[]> {
    if (segment === CampaignSegment.ALL) {
      const subs = await this.subscriptionModel.find({ isActive: true }).select('email').lean();
      return subs.map(s => s.email);
    }
    if (segment === CampaignSegment.BUYERS) {
      const subs = await this.subscriptionModel.find({ isActive: true }).select('email').lean();
      return subs.map(s => s.email);
    }
    if (segment === CampaignSegment.REGISTERED) {
      const subs = await this.subscriptionModel.find({ isActive: true }).select('email').lean();
      return subs.map(s => s.email);
    }
    return [];
  }

  async sendCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new BadRequestException('Campaign not found');
    if (campaign.status === CampaignStatus.SENT) throw new BadRequestException('Campaign already sent');

    const emails = await this.getRecipients(campaign.segment);
    if (emails.length === 0) throw new BadRequestException('No recipients');

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const unsubscribeUrl = this.templateService.buildUnsubscribeUrl(email);
      const htmlContent = this.templateService.render({
        site_name: process.env.SITE_NAME || 'LBB',
        subject: campaign.subject,
        content: campaign.htmlContent,
        unsubscribe_url: unsubscribeUrl,
      });

      try {
        await this.emailService.sendEmail(email, campaign.subject, campaign.htmlContent, htmlContent);
        sent++;
      } catch {
        failed++;
      }
    }

    await this.campaignModel.findByIdAndUpdate(campaignId, {
      status: CampaignStatus.SENT,
      sentAt: new Date(),
      recipientsCount: emails.length,
      sentCount: sent,
      failedCount: failed,
    });

    return { sent, failed };
  }

  async createCampaign(data: {
    subject: string;
    htmlContent: string;
    segment?: CampaignSegment;
    scheduledAt?: Date;
  }): Promise<NewsletterCampaignDocument> {
    const status = data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT;
    return this.campaignModel.create({
      subject: data.subject,
      htmlContent: data.htmlContent,
      segment: data.segment || CampaignSegment.ALL,
      scheduledAt: data.scheduledAt || undefined,
      status,
    });
  }

  async getCampaigns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.campaignModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.campaignModel.countDocuments(),
    ]);
    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getScheduledCampaigns(): Promise<NewsletterCampaignDocument[]> {
    return this.campaignModel.find({
      status: CampaignStatus.SCHEDULED,
      scheduledAt: { $lte: new Date() },
    }).exec();
  }

  async sendAutomatedNewsletter(subject: string, content: string, cta?: { url: string; text: string }): Promise<{ sent: number; failed: number }> {
    const emails = await this.getRecipients(CampaignSegment.ALL);
    if (emails.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const unsubscribeUrl = this.templateService.buildUnsubscribeUrl(email);
      const htmlContent = this.templateService.render({
        site_name: process.env.SITE_NAME || 'LBB',
        subject,
        content,
        unsubscribe_url: unsubscribeUrl,
      }, cta);

      try {
        await this.emailService.sendEmail(email, subject, content, htmlContent);
        sent++;
      } catch {
        failed++;
      }
    }

    await this.campaignModel.create({
      subject,
      htmlContent: content,
      segment: CampaignSegment.ALL,
      status: CampaignStatus.SENT,
      sentAt: new Date(),
      recipientsCount: emails.length,
      sentCount: sent,
      failedCount: failed,
    });

    return { sent, failed };
  }
}