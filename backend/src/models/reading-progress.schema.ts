import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReadingProgressDocument = ReadingProgress & Document;

@Schema({
  timestamps: true,
})
export class ReadingProgress {
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
    default: 1,
    min: 1,
  })
  currentPage!: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
    max: 100,
  })
  progressPercentage!: number;

  @Prop({
    type: Date,
    default: Date.now,
  })
  lastReadAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReadingProgressSchema = SchemaFactory.createForClass(ReadingProgress);

// Unique compound index: one progress record per user per book
ReadingProgressSchema.index({ userRef: 1, bookRef: 1 }, { unique: true });

// Index for finding user's progress
ReadingProgressSchema.index({ userRef: 1, createdAt: -1 });

// Index for sorting by last read time
ReadingProgressSchema.index({ lastReadAt: -1 });
