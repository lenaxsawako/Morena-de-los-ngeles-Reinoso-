import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminAnalyticsService, AdminActivityResponse } from './admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAnalyticsController {
  constructor(private adminAnalyticsService: AdminAnalyticsService) {}

  @Get('activity')
  async getActivity(
    @Query('period') period: string = '7d',
  ): Promise<AdminActivityResponse> {
    // Convert period to days
    let periodDays = 7;
    if (period === '30d') {
      periodDays = 30;
    } else if (period === '90d') {
      periodDays = 90;
    }

    return this.adminAnalyticsService.getActivityData(periodDays);
  }
}
