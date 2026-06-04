import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
})
export class Review {
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
    min: 1,
    max: 5,
  })
  rating!: number;

  @Prop()
  comment?: string;

  @Prop({
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
    index: true,
  })
  status!: ReviewStatus;

  @Prop({
    type: String,
  })
  rejectionReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for analytics and filtering
ReviewSchema.index({ createdAt: -1 });

// Compound index for unique review per user per book
ReviewSchema.index({ userRef: 1, bookRef: 1 }, { unique: true, sparse: true });
