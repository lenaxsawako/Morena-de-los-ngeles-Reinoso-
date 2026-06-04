import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FailedWebhookDocument = FailedWebhook & Document;

@Schema({
  timestamps: true,
})
export class FailedWebhook {
  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop()
  error!: string;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ default: false })
  reprocessed!: boolean;

  @Prop()
  reprocessedAt?: Date;
}

export const FailedWebhookSchema = SchemaFactory.createForClass(FailedWebhook);

FailedWebhookSchema.index({ eventId: 1 });
FailedWebhookSchema.index({ reprocessed: 1, createdAt: -1 });
