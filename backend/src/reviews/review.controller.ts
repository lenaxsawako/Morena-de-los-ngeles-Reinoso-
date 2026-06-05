import { Controller, Get, Post, Param, Body, UseGuards, Request, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async upsert(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewService.upsert(req.user.userId, dto);
  }

  @Get('book/:bookId')
  async getBookReviews(
    @Param('bookId') bookId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const [result, rating] = await Promise.all([
      this.reviewService.getBookReviews(bookId, page, limit),
      this.reviewService.getBookRating(bookId),
    ]);
    return { reviews: result.reviews, total: result.total, page: result.page, totalPages: result.totalPages, ...rating };
  }
}