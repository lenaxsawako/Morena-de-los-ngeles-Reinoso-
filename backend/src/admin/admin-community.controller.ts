import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminCommunityService } from './admin-community.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/community')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCommunityController {
  constructor(private adminCommunityService: AdminCommunityService) {}

  /**
   * GET /admin/community
   * Get complete community dashboard
   */
  @Get()
  async getDashboard() {
    return this.adminCommunityService.getDashboard();
  }

  /**
   * GET /admin/community/activity
   * Get reader activity chart with period selector
   * Query param: period (weekly, monthly)
   */
  @Get('activity')
  async getActivity(@Query('period') period: string = 'monthly') {
    return this.adminCommunityService.getActivity(period);
  }
}

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReviewsController {
  constructor(private adminCommunityService: AdminCommunityService) {}

  /**
   * GET /admin/reviews
   * Get latest approved reviews with pagination
   * Query params: page, limit
   */
  @Get()
  async getLatestReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminCommunityService.getLatestReviews(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}

@Controller('admin/readers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReadersController {
  constructor(private adminCommunityService: AdminCommunityService) {}

  /**
   * GET /admin/readers
   * Get top readers sorted by books owned
   */
  @Get()
  async getTopReaders() {
    return this.adminCommunityService.getTopReaders();
  }
}
