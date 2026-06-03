import { Controller, Post, Get, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import type { Request } from 'express';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private checkoutService: CheckoutService,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
  ) {}

  @Post(':bookId')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Param('bookId') bookId: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.checkoutService.createCheckout(bookId, userId);
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
