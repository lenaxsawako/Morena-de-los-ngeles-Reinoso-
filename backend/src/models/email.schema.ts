import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  VERIFICATION = 'verification',
  PURCHASE_CONFIRMATION = 'purchase_confirmation',
  CUSTOM = 'custom',
}

@Schema({
  timestamps: true,
})
export class Email {
  @Prop({
    required: true,
    lowercase: true,
    trim: true,
  })
  recipient!: string;

  @Prop({
    required: true,
  })
  subject!: string;

  @Prop({
    required: true,
  })
  body!: string;

  @Prop({
    required: true,
  })
  htmlBody!: string;

  @Prop({
    type: String,
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status!: EmailStatus;

  @Prop({
    type: String,
    enum: EmailTemplate,
    default: EmailTemplate.CUSTOM,
  })
  template!: EmailTemplate;

  @Prop({
    default: 0,
  })
  attempts!: number;

  @Prop({
    default: null,
  })
  sentAt?: Date;

  @Prop({
    default: null,
  })
  failedReason?: string;

  @Prop({
    type: Object,
    default: {},
  })
  metadata!: Record<string, unknown>;

  @Prop({
    default: false,
  })
  isRead!: boolean;
}

export const EmailSchema = SchemaFactory.createForClass(Email);

EmailSchema.index({
  recipient: 1,
  createdAt: -1,
});

EmailSchema.index({
  status: 1,
});

EmailSchema.index({
  createdAt: -1,
});
