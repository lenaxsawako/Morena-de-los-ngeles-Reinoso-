import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true, default: 0 })
  order!: number;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for performance
CategorySchema.index({ active: 1, order: 1 });
