import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsletterCampaignDocument = NewsletterCampaign & Document;

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
}

export enum CampaignSegment {
  ALL = 'all',
  BUYERS = 'buyers',
  REGISTERED = 'registered',
}

@Schema({ timestamps: true })
export class NewsletterCampaign {
  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  htmlContent!: string;

  @Prop({ default: CampaignSegment.ALL })
  segment!: CampaignSegment;

  @Prop({ default: CampaignStatus.DRAFT })
  status!: CampaignStatus;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop({ default: 0 })
  recipientsCount!: number;

  @Prop({ default: 0 })
  sentCount!: number;

  @Prop({ default: 0 })
  failedCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NewsletterCampaignSchema = SchemaFactory.createForClass(NewsletterCampaign);
NewsletterCampaignSchema.index({ status: 1 });
NewsletterCampaignSchema.index({ scheduledAt: 1 });