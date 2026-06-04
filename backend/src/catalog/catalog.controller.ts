import { Controller, Get, Query, Param, Req, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Public } from '../decorators/public.decorator';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@Public()
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  /**
   * GET /catalog
   * Returns catalog landing page with latest release, preorder, categories, and featured books
   */
  @Get()
  async getCatalogLanding() {
    return this.catalogService.getCatalogLanding();
  }

  /**
   * GET /categories
   * Returns all active categories
   */
  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }
}

@Controller('books')
@Public()
export class BooksController {
  constructor(private catalogService: CatalogService) {}

  /**
   * GET /books
   * Search/list books with pagination, filters, and text search
   * Query params: q (search), category (slug), page, limit
   */
  @Get()
  async searchBooks(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.searchBooks(
      query,
      category,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
    );
  }

  /**
   * GET /books/id/:id
   * Get book details by MongoDB ID
   */
  @Get('id/:id')
  async getBookById(@Param('id') id: string) {
    return this.catalogService.getBookById(id);
  }

  /**
   * GET /books/id/:id/pdf
   * Stream PDF file from Google Drive
   */
  @Get('id/:id/pdf')
  async getBookPdf(@Param('id') id: string, @Res() res: Response) {
    const { stream, contentType, fileName } = await this.catalogService.getBookPdfStream(id);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    stream.pipe(res);
  }

  /**
   * GET /books/id/:id/series
   * Get prequel and sequels for a book
   */
  @Get('id/:id/series')
  async getSeries(@Param('id') id: string) {
    return this.catalogService.getSeries(id);
  }

  /**
   * GET /books/id/:id/recommendations
   * Get related book recommendations
   */
  @Get('id/:id/recommendations')
  async getRecommendations(@Param('id') id: string, @Req() req: Request) {
    return this.catalogService.getRecommendations(id, (req as any).user?.sub);
  }

  /**
   * GET /books/:slug
   * Get book details by slug (Quick View)
   */
  @Get(':slug')
  async getBookBySlug(@Param('slug') slug: string) {
    return this.catalogService.getBookBySlug(slug);
  }
}
