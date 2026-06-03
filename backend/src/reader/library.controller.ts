import { Controller, Get, Post, Param, Body, UseGuards, Request, Response } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LibraryService } from './library.service';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  /**
   * GET /library
   * Returns all books purchased by authenticated user with reading progress
   * Includes title, coverUrl, progressPercentage, and status
   */
  @Get()
  async getCollection(@Request() req: any) {
    return this.libraryService.getCollection(req.user.userId);
  }

  /**
   * GET /library/dashboard
   * Returns dashboard data: continueReading and full collection
   */
  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.libraryService.getDashboard(req.user.userId);
  }

  /**
   * GET /library/continue-reading
   * Returns the most recently opened book
   */
  @Get('continue-reading')
  async getContinueReading(@Request() req: any, @Response() res: any) {
    const result = await this.libraryService.getContinueReading(req.user.userId);
    return res.json(result);
  }

  /**
   * GET /library/recent
   * Returns recently opened books sorted by lastReadAt DESC
   */
  @Get('recent')
  async getRecentlyOpened(@Request() req: any) {
    return this.libraryService.getRecentlyOpened(req.user.userId);
  }

  /**
   * GET /library/favorites
   * Returns books with at least one bookmark
   */
  @Get('favorites')
  async getFavorites(@Request() req: any) {
    return this.libraryService.getFavorites(req.user.userId);
  }

  /**
   * POST /library/sync
   * Sync guest progress with authenticated user's progress
   * Request body: array of {bookId, currentPage, progressPercentage, lastReadAt}
   */
  @Post('sync')
  async syncGuestProgress(@Request() req: any, @Body() guestProgressData: Array<any>) {
    return this.libraryService.syncGuestProgress(req.user.userId, guestProgressData);
  }

  /**
   * GET /library/stats
   * Returns reading statistics for authenticated user
   */
  @Get('stats')
  async getReadingStats(@Request() req: any) {
    return this.libraryService.getReadingStats(req.user.userId);
  }

  /**
   * GET /library/:bookId
   * Returns book details with reading progress
   */
  @Get(':bookId')
  async getBookDetail(@Request() req: any, @Param('bookId') bookId: string) {
    return this.libraryService.getBookDetail(req.user.userId, bookId);
  }
}
