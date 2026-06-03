import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AnalyticsService, ReaderActivityResponse, StatsResponse } from './analytics.service';

@Controller('reader/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('activity')
  async getActivity(
    @Request() req: any,
    @Query('period') period: string = '7d',
  ): Promise<ReaderActivityResponse> {
    const userId = req.user.userId;

    // Convert period to days
    let periodDays = 7;
    if (period === '30d') {
      periodDays = 30;
    } else if (period === '90d') {
      periodDays = 90;
    }

    return this.analyticsService.getActivityData(userId, periodDays);
  }

  @Get('stats')
  async getStats(@Request() req: any): Promise<StatsResponse> {
    const userId = req.user.userId;
    return this.analyticsService.getStats(userId);
  }
}
