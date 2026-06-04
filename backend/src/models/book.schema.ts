import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({
  timestamps: true,
})
export class Book {
  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  authorRef?: Types.ObjectId;

  @Prop({
    default: '',
  })
  description!: string;

  @Prop({
    default: '',
  })
  subtitle!: string;

  @Prop()
  coverUrl?: string;

  // Google Drive

  @Prop()
  driveFileId?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop({
    default: 0,
  })
  totalPages!: number;

  // Preview

  @Prop({
    default: 10,
    min: 0,
  })
  previewPages!: number;

  // Venta

  @Prop({
    default: false,
  })
  isPaid!: boolean;

  @Prop({
    default: 0,
    min: 0,
  })
  priceCents!: number;

  @Prop({
    default: 'USD',
  })
  currency!: string;

  // Publicación

  @Prop({
    default: false,
  })
  isPublished!: boolean;

  @Prop({
    default: false,
    index: true,
  })
  isFeatured!: boolean;

  @Prop({
    default: false,
  })
  isLatestRelease!: boolean;

  @Prop({
    default: 0,
  })
  order!: number;

  @Prop()
  publishedAt?: Date;

@Prop({
  default: 0,
})
views!: number;

@Prop({
  default: 0,
})
sales!: number;

@Prop({
  default: '',
})
polarProductId!: string;

  // Categoría

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
  })
  categoryRef?: Types.ObjectId;

  // Pre-compra

  @Prop({
    default: false,
    index: true,
  })
  isPreorder!: boolean;

  @Prop()
  releaseDate?: Date;

  // Metadata libre

  @Prop({
    type: Types.ObjectId,
    ref: 'Book',
    default: null,
  })
  prequelRef?: Types.ObjectId;

  @Prop({
    type: Object,
    default: {},
  })
  metadata!: Record<string, unknown>;
}

export const BookSchema =
  SchemaFactory.createForClass(Book);

// Search & Filtering indexes
BookSchema.index({ title: 1 });
BookSchema.index({ categoryRef: 1 });
BookSchema.index({ publishedAt: -1 });
BookSchema.index({
  title: 'text',
  description: 'text',
});