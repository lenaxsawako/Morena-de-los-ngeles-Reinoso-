import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Response,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminBooksService } from './admin-books.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminReportingService } from './admin-reporting.service';
import { CreateBookDto } from './dto/create-book.dto';
import { AttachDriveFileDto, UpdateBookDto } from './dto/update-book.dto';
import { MarkPreorderDto } from './dto/mark-preorder.dto';
import { PublishBookDto } from './dto/publish-book.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CloudinaryService } from '../utils/cloudinary.service';
import { AdminDemoInterceptor } from '../interceptors/admin-demo.interceptor';

const COVER_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@Controller('admin/books')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseInterceptors(AdminDemoInterceptor)
export class AdminBooksController {
  constructor(
    private adminBooksService: AdminBooksService,
    private adminAnalyticsService: AdminAnalyticsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private async uploadCoverImage(coverFile: {
    buffer?: Buffer;
    originalname: string;
    mimetype: string;
  }): Promise<string> {
    if (!this.cloudinaryService.isConfigured()) {
      throw new BadRequestException(
        'Cloudinary no está configurado. Actívalo en Ajustes → Almacenamiento.',
      );
    }

    if (!coverFile.buffer?.length) {
      throw new BadRequestException('No se pudo leer el archivo de portada');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(coverFile.mimetype)) {
      throw new BadRequestException('La portada debe ser JPEG, PNG o WebP');
    }

    try {
      return await this.cloudinaryService.uploadImage(
        coverFile.buffer,
        coverFile.originalname,
        coverFile.mimetype,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir la portada';
      throw new BadRequestException(message);
    }
  }

  /**
   * GET /admin/books/dashboard
   * Get admin dashboard statistics
   */
  @Get('dashboard')
  async getDashboard() {
    return this.adminBooksService.getDashboard();
  }

  /**
   * GET /admin/books/activity
   * Get paginated activity (purchases and registrations)
   */
  @Get('activity')
  async getActivity(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminAnalyticsService.getAllActivity(Number(page), Number(limit));
  }

  /**
   * GET /admin/books
   * List books with status filter and pagination
   * Query params: status (published|draft|preorder), page, limit
   */
  @Get()
  async listBooks(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminBooksService.listBooks(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
    );
  }

  /**
   * POST /admin/books
   * Create new book with optional cover image
   * Files: cover (multipart form-data)
   */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }], COVER_UPLOAD_OPTIONS),
  )
  async createBook(
    @Body() dto: CreateBookDto,
    @UploadedFiles() files: { cover?: any[] },
  ) {
    let coverUrl: string | undefined;

    if (files.cover?.length) {
      coverUrl = await this.uploadCoverImage(files.cover[0]);
    }

    return this.adminBooksService.createBook(dto, coverUrl);
  }

  /**
   * GET /admin/books/:id
   * Get book details by ID
   */
  @Get(':id')
  async getBook(@Param('id') id: string) {
    return this.adminBooksService.getBook(id);
  }

  /**
   * PUT /admin/books/:id
   * Update book fields
   */
  @Put(':id')
  async updateBook(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.adminBooksService.updateBook(id, dto);
  }

  /**
   * PATCH /admin/books/:id/cover
   * Upload or replace cover image
   */
  @Patch(':id/cover')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cover', maxCount: 1 }], COVER_UPLOAD_OPTIONS),
  )
  async updateBookCover(
    @Param('id') id: string,
    @UploadedFiles() files: { cover?: any[] },
  ) {
    if (!files.cover?.length) {
      throw new BadRequestException('Cover image is required');
    }

    const coverUrl = await this.uploadCoverImage(files.cover[0]);
    return this.adminBooksService.updateBookCover(id, coverUrl);
  }

  /**
   * PATCH /admin/books/:id/drive-file
   * Attach an existing Google Drive PDF to a book.
   */
  @Patch(':id/drive-file')
  async attachDriveFile(@Param('id') id: string, @Body() dto: AttachDriveFileDto) {
    return this.adminBooksService.attachDriveFile(id, dto);
  }

  /**
   * PATCH /admin/books/:id/publish
   * Publish book (isPublished = true, publishedAt = now)
   */
  @Patch(':id/publish')
  async publishBook(@Param('id') id: string, @Body() dto: PublishBookDto) {
    return this.adminBooksService.publishBook(id, dto?.asPreorder === true, dto?.releaseDate);
  }

  /**
   * PATCH /admin/books/:id/unpublish
   * Unpublish book (isPublished = false)
   */
  @Patch(':id/unpublish')
  async unpublishBook(@Param('id') id: string) {
    return this.adminBooksService.unpublishBook(id);
  }

  /**
   * PATCH /admin/books/:id/latest
   * Mark as latest release (only one allowed)
   */
  @Patch(':id/latest')
  async markLatestRelease(@Param('id') id: string) {
    return this.adminBooksService.markLatestRelease(id);
  }

  /**
   * PATCH /admin/books/:id/preorder
   * Mark as preorder with release date
   */
  @Patch(':id/preorder')
  async markPreorder(@Param('id') id: string, @Body() dto: MarkPreorderDto) {
    return this.adminBooksService.markPreorder(id, dto);
  }

  /**
   * GET /admin/books/:id/stats
   * Get book statistics
   */
  @Get(':id/stats')
  async getBookStats(@Param('id') id: string) {
    return this.adminBooksService.getBookStats(id);
  }

  /**
   * GET /admin/books/:id/analytics
   * Get detailed analytics for a book
   */
  @Get(':id/analytics')
  async getBookAnalytics(@Param('id') id: string) {
    return this.adminAnalyticsService.getBookAnalytics(id);
  }

  /**
   * DELETE /admin/books/:id
   * Delete a book
   */
  @Delete(':id')
  async deleteBook(@Param('id') id: string) {
    return this.adminBooksService.deleteBook(id);
  }
}

/**
 * Analytics Controller
 * Separate controller for dashboard analytics
 */
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseInterceptors(AdminDemoInterceptor)
export class AdminDashboardController {
  constructor(
    private adminAnalyticsService: AdminAnalyticsService,
    private adminReportingService: AdminReportingService,
  ) {}

  /**
   * GET /admin/dashboard
   * Get admin dashboard with summary, recent activity, and books overview
   */
  @Get()
  async getDashboard() {
    return this.adminAnalyticsService.getDashboard();
  }

  /**
   * GET /admin/dashboard/analytics
   * Get comprehensive analytics with summary, chart, and top books
   * Query param: period (7d, 30d, 90d, 12m)
   */
  @Get('analytics')
  async getAnalytics(@Query('period') period: string = '30d') {
    return this.adminReportingService.getAnalytics(period);
  }

  /**
   * GET /admin/dashboard/transactions
   * Get transaction history with pagination and filtering
   * Query params: page, limit, status (completed|pending|refunded)
   */
  @Get('transactions')
  async getTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminReportingService.getTransactions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  /**
   * GET /admin/dashboard/reports/export
   * Export transaction history as CSV
   * Query param: status (optional)
   */
  @Get('reports/export')
  async exportTransactionsCSV(@Query('status') status?: string, @Response() res?: any) {
    const csv = await this.adminReportingService.exportTransactionsCSV(status);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  }
}
