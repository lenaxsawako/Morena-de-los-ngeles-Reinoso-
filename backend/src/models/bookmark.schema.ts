import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookmarkDocument = Bookmark & Document;

@Schema({
  timestamps: true,
})
export class Bookmark {
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
  })
  page!: number;

  @Prop({
    default: '',
    maxlength: 500,
  })
  note!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Compound index for finding user's bookmarks in a book
BookmarkSchema.index({ userRef: 1, bookRef: 1 });

// Index for sorting bookmarks by page
BookmarkSchema.index({ userRef: 1, bookRef: 1, page: 1 });

// Index for finding all bookmarks for a user
BookmarkSchema.index({ userRef: 1, createdAt: -1 });
