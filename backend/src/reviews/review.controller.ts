import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
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
  async getBookReviews(@Param('bookId') bookId: string) {
    const [reviews, rating] = await Promise.all([
      this.reviewService.getBookReviews(bookId),
      this.reviewService.getBookRating(bookId),
    ]);
    return { reviews, ...rating };
  }
}