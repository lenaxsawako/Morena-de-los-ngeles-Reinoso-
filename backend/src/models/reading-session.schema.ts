import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReadingSessionDocument = ReadingSession & Document;

@Schema({
  timestamps: true,
})
export class ReadingSession {
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
    type: Types.ObjectId,
    ref: 'Book',
  })
  bookTitle?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Book',
  })
  bookCoverUrl?: string;

  @Prop({
    required: true,
    min: 1,
  })
  startPage!: number;

  @Prop({
    required: true,
    min: 1,
  })
  endPage!: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  pagesRead!: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  durationMinutes!: number;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  })
  sessionStartAt!: Date;

  @Prop({
    type: Date,
    required: true,
  })
  sessionEndAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReadingSessionSchema = SchemaFactory.createForClass(ReadingSession);

// Compound index for efficient queries
ReadingSessionSchema.index({ userRef: 1, sessionStartAt: -1 });
ReadingSessionSchema.index({ userRef: 1, bookRef: 1 });
