import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}

  /**
   * GET /bookmarks/:bookId
   * Returns all bookmarks for authenticated user in a book
   */
  @Get(':bookId')
  async getBookmarks(@Request() req: any, @Param('bookId') bookId: string) {
    return this.bookmarkService.getBookmarks(req.user.userId, bookId);
  }

  /**
   * POST /bookmarks/:bookId
   * Create a bookmark
   */
  @Post(':bookId')
  async createBookmark(
    @Request() req: any,
    @Param('bookId') bookId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.createBookmark(req.user.userId, bookId, dto);
  }

  /**
   * PUT /bookmarks/:bookmarkId
   * Update a bookmark
   */
  @Put(':bookmarkId')
  async updateBookmark(
    @Request() req: any,
    @Param('bookmarkId') bookmarkId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.updateBookmark(req.user.userId, bookmarkId, dto);
  }

  /**
   * DELETE /bookmarks/:bookmarkId
   * Delete a bookmark
   */
  @Delete(':bookmarkId')
  async deleteBookmark(@Request() req: any, @Param('bookmarkId') bookmarkId: string) {
    return this.bookmarkService.deleteBookmark(req.user.userId, bookmarkId);
  }

  /**
   * GET /bookmarks
   * Get all bookmarks for authenticated user
   */
  @Get()
  async getAllBookmarks(@Request() req: any) {
    return this.bookmarkService.getAllUserBookmarks(req.user.userId);
  }
}
