import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { AttachDriveFileDto, UpdateBookDto } from './dto/update-book.dto';
import { MarkPreorderDto } from './dto/mark-preorder.dto';
import { DriveService } from '../utils/drive.service';
import { PolarService } from '../utils/polar.service';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class AdminBooksService {
  private readonly logger = new Logger(AdminBooksService.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    private driveService: DriveService,
    private polarService: PolarService,
  ) {}

  /**
   * Get admin dashboard statistics
   */
  async getDashboard() {
    const [totalBooks, publishedBooks, draftBooks, preorders, totalPurchases, purchaseData] = await Promise.all([
      this.bookModel.countDocuments(),
      this.bookModel.countDocuments({ isPublished: true }),
      this.bookModel.countDocuments({ isPublished: false }),
      this.bookModel.countDocuments({ isPreorder: true }),
      this.purchaseModel.countDocuments(),
      this.purchaseModel
        .find()
        .select('priceCents createdAt')
        .lean(),
    ]);

    // Calculate revenue
    const totalRevenue = purchaseData.reduce((sum, p: any) => sum + (p.priceCents || 0), 0);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthlyPurchases = purchaseData.filter((p: any) => p.createdAt > monthAgo);
    const monthRevenue = monthlyPurchases.reduce((sum, p: any) => sum + (p.priceCents || 0), 0);

    return {
      totalBooks,
      publishedBooks,
      draftBooks,
      preorders,
      totalPurchases,
      revenue: {
        month: monthRevenue,
        total: totalRevenue,
      },
    };
  }

  /**
   * List books with status filter and pagination
   */
  async listBooks(status?: string, page: number = 1, limit: number = 12) {
    const filter: any = {};

    if (status === 'published') {
      filter.isPublished = true;
    } else if (status === 'draft') {
      filter.isPublished = false;
    } else if (status === 'preorder') {
      filter.isPreorder = true;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .select(
          '_id title subtitle description isPublished isPreorder previewPages coverUrl totalPages priceCents currency driveFileId publishedAt createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      pages,
    };
  }

  /**
   * Create new book
   */
  async createBook(dto: CreateBookDto, coverUrl?: string) {
    const slug = this.generateSlug(dto.title);

    // Check if slug already exists
    const existing = await this.bookModel.findOne({ slug }).lean();
    if (existing) {
      throw new BadRequestException(`Book with title "${dto.title}" already exists`);
    }

    let polarProductId = dto.polarProductId || '';

    // Auto-create Polar product if price > 0 and no polarProductId provided
    if (!polarProductId && (dto.priceCents || 0) > 0) {
      const status = this.polarService.getStatus();
      this.logger.debug(`[POLAR DEBUG] about to createProduct — Polar enabled: ${status.enabled}, configured: ${status.configured}`);
      try {
        const result = await this.polarService.createProduct({
          name: dto.title,
          description: dto.description || '',
          priceAmount: dto.priceCents || 0,
          currency: (dto.currency || 'USD').toLowerCase(),
        });
        polarProductId = result.id;
        this.logger.log(`Auto-created Polar product ${result.id} for book "${dto.title}"`);
      } catch (err) {
        this.logger.warn(`Failed to auto-create Polar product: ${err.message}`);
      }
    }

    const book = new this.bookModel({
      title: dto.title,
      subtitle: dto.subtitle || '',
      description: dto.description || '',
      slug,
      priceCents: dto.priceCents || 0,
      currency: dto.currency || 'USD',
      previewPages: dto.previewPages || 10,
      coverUrl: coverUrl || undefined,
      categoryRef: dto.categoryRef ? new Types.ObjectId(dto.categoryRef) : undefined,
      polarProductId,
      isPublished: false,
      isPreorder: false,
    });

    return await book.save();
  }

  /**
   * Get book by ID
   */
  async getBook(id: string) {
    const book = await this.bookModel.findById(id).lean();
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }
    return book;
  }

  /**
   * Update book fields
   */
  async updateBook(id: string, dto: UpdateBookDto) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    const originalPriceCents = book.priceCents;
    const originalPolarProductId = book.polarProductId;

    if (dto.title && dto.title !== book.title) {
      const newSlug = this.generateSlug(dto.title);
      const existing = await this.bookModel.findOne({ slug: newSlug, _id: { $ne: id } }).lean();
      if (existing) {
        throw new BadRequestException(`Book with title "${dto.title}" already exists`);
      }
      book.slug = newSlug;
    }

    if (dto.title) book.title = dto.title;
    if (dto.subtitle !== undefined) book.subtitle = dto.subtitle;
    if (dto.description !== undefined) book.description = dto.description;
    if (dto.priceCents !== undefined) book.priceCents = dto.priceCents;
    if (dto.currency) book.currency = dto.currency;
    if (dto.previewPages !== undefined) book.previewPages = dto.previewPages;
    if (dto.categoryRef) {
      book.categoryRef = new Types.ObjectId(dto.categoryRef);
    }

    if (dto.isFeatured !== undefined) book.isFeatured = dto.isFeatured;
    if (dto.polarProductId !== undefined) book.polarProductId = dto.polarProductId;

    // Sync Polar product (only create if missing, only update if price changed)
    const currentPrice = book.priceCents;
    if (currentPrice > 0) {
      if (originalPolarProductId) {
        // Product exists — only update if price actually changed
        if (dto.priceCents !== undefined && dto.priceCents !== originalPriceCents) {
          try {
            await this.polarService.updateProduct({
              id: originalPolarProductId,
              priceAmount: currentPrice,
              currency: (book.currency || 'USD').toLowerCase(),
            });
            this.logger.log(`Updated Polar product ${originalPolarProductId} price to ${currentPrice}`);
          } catch (err) {
            this.logger.warn(`Failed to update Polar product: ${err.message}`);
          }
        }
      } else {
        // No product yet — auto-create
        try {
          const result = await this.polarService.createProduct({
            name: book.title,
            description: book.description || '',
            priceAmount: currentPrice,
            currency: (book.currency || 'USD').toLowerCase(),
          });
          book.polarProductId = result.id;
          this.logger.log(`Auto-created Polar product ${result.id} for book "${book.title}"`);
        } catch (err) {
          this.logger.warn(`Failed to auto-create Polar product: ${err.message}`);
        }
      }
    }

    // Recalcular páginas desde el PDF si tiene driveFileId
    if (book.driveFileId && book.mimeType === 'application/pdf') {
      try {
        const pdfBuffer = await this.driveService.downloadFileAsBuffer(book.driveFileId);
        const parser = new PDFParse({ data: pdfBuffer });
        const pdfData = await parser.getInfo();
        book.totalPages = pdfData.total;
      } catch (err) {
        console.warn(`Could not parse PDF page count for book ${id}: ${(err as Error).message}`);
      }
    }

    return await book.save();
  }

  /**
   * Update book cover image URL
   */
  async updateBookCover(id: string, coverUrl: string) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    book.coverUrl = coverUrl;
    return await book.save();
  }

  /**
   * Attach metadata for an existing PDF stored in Google Drive.
   */
  async attachDriveFile(id: string, dto: AttachDriveFileDto) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    book.driveFileId = dto.driveFileId;
    book.mimeType = dto.mimeType || 'application/pdf';
    if (dto.fileSize !== undefined) {
      book.fileSize = dto.fileSize;
    }

    // Auto-detect page count from PDF
    if (dto.totalPages !== undefined) {
      book.totalPages = dto.totalPages;
    } else if (book.mimeType === 'application/pdf') {
      try {
        const pdfBuffer = await this.driveService.downloadFileAsBuffer(dto.driveFileId);
        const parser = new PDFParse({ data: pdfBuffer });
        const pdfData = await parser.getInfo();
        book.totalPages = pdfData.total;
      } catch (err) {
        // If PDF parsing fails, leave totalPages as-is
        console.warn(`Could not parse PDF page count for book ${id}: ${(err as Error).message}`);
      }
    }

    return await book.save();
  }

  /**
   * Publish book as normal release or pre-order
   */
  async publishBook(id: string, asPreorder = false, releaseDate?: string) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    book.isPublished = true;
    book.publishedAt = new Date();

    if (asPreorder) {
      if (!releaseDate) {
        throw new BadRequestException('releaseDate is required for pre-order');
      }
      book.isPreorder = true;
      book.releaseDate = new Date(releaseDate);
    } else {
      book.isPreorder = false;
      book.releaseDate = undefined;

      // Mark as latest release (clear all others, set this one)
      await this.bookModel.updateMany({ _id: { $ne: id } }, { isLatestRelease: false });
      book.isLatestRelease = true;
    }

    return await book.save();
  }

  /**
   * Unpublish book (set isPublished false)
   */
  async unpublishBook(id: string) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    book.isPublished = false;
    book.isPreorder = false;

    return await book.save();
  }

  /**
   * Mark book as latest release (only one allowed)
   */
  async markLatestRelease(id: string) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    // Remove isLatestRelease from all books
    await this.bookModel.updateMany({}, { isLatestRelease: false });

    // Set this book as latest
    book.isLatestRelease = true;
    return await book.save();
  }

  /**
   * Mark book as preorder with release date
   */
  async markPreorder(id: string, dto: MarkPreorderDto) {
    const book = await this.bookModel.findById(id);
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    book.isPreorder = true;
    book.isPublished = true;
    book.releaseDate = new Date(dto.releaseDate);
    if (!book.publishedAt) {
      book.publishedAt = new Date();
    }

    return await book.save();
  }

  /**
   * Get book statistics
   */
  async getBookStats(id: string) {
    const book = await this.bookModel.findById(id).lean();
    if (!book) {
      throw new NotFoundException(`Book not found`);
    }

    const [purchases, bookRevenue] = await Promise.all([
      this.purchaseModel.countDocuments({ bookRef: id }),
      this.purchaseModel
        .find({ bookRef: id })
        .select('priceCents')
        .lean(),
    ]);

    const revenue = bookRevenue.reduce((sum, p: any) => sum + (p.priceCents || 0), 0);
    const conversionRate = book.views > 0 ? ((purchases / book.views) * 100).toFixed(2) : '0';

    return {
      views: book.views || 0,
      previewReaders: 0, // Would need separate tracking
      purchases,
      revenue,
      conversionRate: parseFloat(conversionRate as string),
    };
  }

  /**
   * Generate URL-safe slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}
