import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ReadingProgressService } from './reading-progress.service';
import { CreateReadingProgressDto } from './dto/create-reading-progress.dto';

@Controller('reading-progress')
@UseGuards(JwtAuthGuard)
export class ReadingProgressController {
  constructor(private readingProgressService: ReadingProgressService) {}

  /**
   * GET /reading-progress/:bookId
   * Returns current reading progress for authenticated user and book
   */
  @Get(':bookId')
  async getProgress(@Request() req: any, @Param('bookId') bookId: string) {
    return this.readingProgressService.getProgress(req.user.userId, bookId);
  }

  /**
   * POST /reading-progress/:bookId
   * Create or update reading progress
   */
  @Post(':bookId')
  async updateProgress(
    @Request() req: any,
    @Param('bookId') bookId: string,
    @Body() dto: CreateReadingProgressDto,
  ) {
    return this.readingProgressService.updateProgress(req.user.userId, bookId, dto);
  }

  /**
   * GET /reading-progress
   * Get all reading progress for authenticated user
   */
  @Get()
  async getUserProgress(@Request() req: any) {
    return this.readingProgressService.getUserProgress(req.user.userId);
  }
}
