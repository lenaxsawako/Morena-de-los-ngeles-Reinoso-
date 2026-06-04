import { Controller, Get, Param, Post, Body, Put, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCommunityService } from './admin-community.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Review, ReviewDocument, ReviewStatus } from '../models/review.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
  constructor(
    private adminCommunityService: AdminCommunityService,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  /**
   * GET /admin/reviews
   * Get all reviews with pagination and optional status filter
   * Query params: page, limit, status (pending, approved, rejected)
   */
  @Get()
  async getLatestReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    if (status && !Object.values(ReviewStatus).includes(status as ReviewStatus)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${Object.values(ReviewStatus).join(', ')}`);
    }

    const filter: any = status ? { status: status as ReviewStatus } : {};
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userRef', 'profile.username email')
        .populate('bookRef', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      items: reviews.map((r: any) => ({
        id: r._id,
        userName: r.userRef?.profile?.username || r.userRef?.email || 'Anonymous',
        bookTitle: r.bookRef?.title || 'Unknown',
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * PUT /admin/reviews/:id/approve
   */
  @Put(':id/approve')
  async approveReview(@Param('id') id: string) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status: ReviewStatus.APPROVED, rejectionReason: undefined },
      { new: true },
    );
    if (!review) throw new NotFoundException('Review not found');
    return { id: review._id, status: review.status };
  }

  /**
   * PUT /admin/reviews/:id/reject
   */
  @Put(':id/reject')
  async rejectReview(@Param('id') id: string, @Body('reason') reason?: string) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status: ReviewStatus.REJECTED, rejectionReason: reason || null },
      { new: true },
    );
    if (!review) throw new NotFoundException('Review not found');
    return { id: review._id, status: review.status };
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
