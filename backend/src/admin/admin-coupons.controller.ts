import { Controller, Post, Get, Delete, Param, Body, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.schema';
import { Coupon, CouponDocument } from '../models/coupon.schema';
import { PolarService } from '../utils/polar.service';
import { AdminDemoInterceptor } from '../interceptors/admin-demo.interceptor';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(AdminDemoInterceptor)
export class AdminCouponsController {
  private readonly logger = new Logger(AdminCouponsController.name);

  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    private polarService: PolarService,
  ) {}

  @Post()
  async create(@Body() dto: {
    name: string;
    code: string;
    type: 'percentage' | 'fixed';
    amount: number;
    endsAt?: string;
    maxRedemptions?: number;
    maxUsesPerUser?: number;
  }) {
    const polar = await this.polarService.createDiscount({
      name: dto.name,
      code: dto.code.toUpperCase(),
      type: dto.type,
      amount: dto.amount,
      endsAt: dto.endsAt,
      maxRedemptions: dto.maxRedemptions,
    });

    const coupon = await this.couponModel.create({
      polarDiscountId: polar.id,
      code: polar.code,
      maxUsesPerUser: dto.maxUsesPerUser ?? 1,
    });

    return coupon;
  }

  @Get()
  async list() {
    const [polarDiscounts, localCoupons] = await Promise.all([
      this.polarService.listDiscounts().catch(() => []),
      this.couponModel.find().lean(),
    ]);

    const localMap = new Map(localCoupons.map(c => [c.polarDiscountId, c]));

    return polarDiscounts.map((pd: any) => {
      const local = localMap.get(pd.id);
      return {
        polarDiscountId: pd.id,
        code: pd.code,
        name: pd.name,
        type: pd.type,
        amount: pd.type === 'percentage' ? ((pd.basis_points ?? 0) / 100) : pd.amount,
        redemptionsCount: pd.redemptions_count ?? 0,
        maxRedemptions: pd.max_redemptions,
        endsAt: pd.ends_at,
        maxUsesPerUser: local?.maxUsesPerUser ?? 1,
        usedBy: local?.usedBy ?? [],
        createdAt: pd.created_at,
      };
    });
  }

  @Delete(':polarDiscountId')
  async delete(@Param('polarDiscountId') polarDiscountId: string) {
    await this.polarService.deleteDiscount(polarDiscountId);
    await this.couponModel.deleteOne({ polarDiscountId });
    return { message: 'Coupon deleted' };
  }
}
