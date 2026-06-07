import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: String, default: null })
  orderId?: string | null;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status!: TicketStatus;

  @Prop({ type: [{ role: { type: String, enum: ['user', 'admin'] }, content: String, createdAt: { type: Date, default: Date.now } }], default: [] })
  messages!: { role: string; content: string; createdAt: Date }[];

  @Prop({ type: String, default: null })
  adminReply?: string | null;

  @Prop({ type: Date, default: null })
  repliedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ status: 1, createdAt: -1 });
