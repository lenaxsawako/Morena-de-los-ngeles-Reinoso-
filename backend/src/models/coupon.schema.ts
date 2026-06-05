import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  polarDiscountId!: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code!: string;

  @Prop({ default: 1 })
  maxUsesPerUser!: number;

  @Prop({
    type: [{ userId: { type: Types.ObjectId, ref: 'User' }, usedAt: Date }],
    default: [],
  })
  usedBy!: { userId: Types.ObjectId; usedAt: Date }[];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.index({ code: 1 });
