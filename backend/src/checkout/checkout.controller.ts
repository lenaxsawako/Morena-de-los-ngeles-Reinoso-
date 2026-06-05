import { Controller, Post, Get, Param, Body, UseGuards, Req, BadRequestException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { Coupon, CouponDocument } from '../models/coupon.schema';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import type { Request } from 'express';

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(
    private checkoutService: CheckoutService,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  @Post(':bookId')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @Param('bookId') bookId: string,
    @Body('couponCode') couponCode: string | undefined,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const origin = req.headers['origin'] || req.headers['host'] || '';
    return this.checkoutService.createCheckout(bookId, userId, origin as string, couponCode);
  }

  @Post('validate-coupon')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(@Body() dto: ValidateCouponDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    const coupon = await this.couponModel.findOne({ code: dto.code.toUpperCase() }).lean();
    if (!coupon) {
      return { valid: false, reason: 'El código no es válido' };
    }

    if (coupon.maxUsesPerUser > 0) {
      const used = coupon.usedBy?.find(u => u.userId.toString() === userId);
      if (used) {
        return { valid: false, reason: 'Ya usaste este cupón' };
      }
    }

    return { valid: true, polarDiscountId: coupon.polarDiscountId, description: `Cupón aplicado` };
  }

  @Get('purchases')
  @UseGuards(JwtAuthGuard)
  async getPurchases(@Req() req: Request) {
    const userId = (req as any).user.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.purchaseModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', 'title coverUrl slug')
      .sort({ createdAt: -1 })
      .lean();
  }
}
