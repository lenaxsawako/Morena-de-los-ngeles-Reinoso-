import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseDocument = Purchase & Document;

export enum PurchaseStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  POLAR = 'polar',
}

@Schema({
  timestamps: true,
})
export class Purchase {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userRef!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true,
  })
  bookRef!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  purchaseToken!: string;

  @Prop({
    enum: PaymentProvider,
    default: PaymentProvider.POLAR,
  })
  provider!: PaymentProvider;

  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
    index: true,
  })
  status!: PurchaseStatus;

  @Prop()
  providerOrderId?: string;

  @Prop()
  providerCustomerId?: string;

  @Prop({
    required: true,
    min: 0,
  })
  amountCents!: number;

  @Prop({
    default: 'USD',
  })
  currency!: string;

  @Prop()
  paidAt?: Date;

  @Prop({
    type: Object,
    default: {},
  })
  receipt!: Record<string, unknown>;

  @Prop({
    type: Object,
    default: {},
  })
  metadata!: Record<string, unknown>;
}

export const PurchaseSchema =
  SchemaFactory.createForClass(Purchase);

// Indexes for analytics and filtering
PurchaseSchema.index({ userRef: 1, bookRef: 1 }, { unique: true });
PurchaseSchema.index({ provider: 1 });
PurchaseSchema.index({ createdAt: -1 });

PurchaseSchema.index({
  providerOrderId: 1,
});