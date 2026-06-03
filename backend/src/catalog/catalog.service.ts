import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Category, CategoryDocument } from '../models/category.schema';
import { DriveService } from '../utils/drive.service';
import { Readable } from 'stream';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private driveService: DriveService,
  ) {}

  /**
   * Get catalog landing page data
   */
  async getCatalogLanding() {
    const [latestRelease, preorderBook, categories, featuredBooks] = await Promise.all([
      this.getLatestRelease(),
      this.getPreorderBook(),
      this.getCategories(),
      this.getFeaturedBooks(),
    ]);

    return {
      latestRelease,
      preorderBook,
      categories,
      featuredBooks,
    };
  }

  /**
   * Get latest published book (most recent publishedAt)
   */
  async getLatestRelease() {
    const book = await this.bookModel
      .findOne({ isPublished: true, isPreorder: false })
      .select('_id title subtitle description coverUrl publishedAt')
      .sort({ publishedAt: -1 })
      .lean();

    return book || null;
  }

  /**
   * Get next preorder book (earliest releaseDate)
   */
  async getPreorderBook() {
    const book = await this.bookModel
      .findOne({ isPublished: true, isPreorder: true })
      .select('_id title description coverUrl releaseDate')
      .sort({ releaseDate: 1 })
      .lean();

    return book || null;
  }

  /**
   * Get all active categories
   */
  async getCategories() {
    const categories = await this.categoryModel
      .find({ active: true })
      .select('_id name slug')
      .sort({ order: 1 })
      .lean();

    return categories;
  }

  /**
   * Get featured books (6 books max)
   */
  async getFeaturedBooks() {
    const books = await this.bookModel
      .find({ isPublished: true, isFeatured: true, isPreorder: false })
      .select('_id title description coverUrl priceCents')
      .sort({ order: 1, publishedAt: -1 })
      .limit(6)
      .lean();

    return books;
  }

  /**
   * Search books with pagination, filters, and text search
   */
  async searchBooks(
    query?: string,
    category?: string,
    page: number = 1,
    limit: number = 12,
  ) {
    const filter: any = { isPublished: true, isPreorder: false };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
      const categoryDoc = await this.categoryModel.findOne({ slug: category }).lean();
      if (categoryDoc) {
        filter.categoryRef = categoryDoc._id;
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .select('_id title description coverUrl priceCents categoryRef')
        .populate('categoryRef', 'name slug')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items: items.map((item: any) => ({
        _id: item._id,
        title: item.title,
        description: item.description,
        coverUrl: item.coverUrl,
        priceCents: item.priceCents,
        category: item.categoryRef?.name || 'Uncategorized',
      })),
      total,
      page,
      pages,
    };
  }

  /**
   * Get complete catalog without filters
   */
  async getCompleteCatalog(page: number = 1, limit: number = 12) {
    return this.searchBooks(undefined, undefined, page, limit);
  }

  /**
   * Get book details by MongoDB ID
   */
  async getBookById(id: string) {
    const book = await this.bookModel
      .findById(id)
      .where('isPublished').equals(true)
      .select(
        '_id title subtitle description coverUrl priceCents currency previewPages totalPages categoryRef',
      )
      .populate('categoryRef', 'name slug')
      .lean();

    if (!book) {
      return null;
    }

    return {
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverUrl: book.coverUrl,
      priceCents: book.priceCents,
      currency: book.currency,
      previewPages: book.previewPages,
      totalPages: book.totalPages,
      category: book.categoryRef,
    };
  }

  /**
   * Get PDF stream for reading
   */
  async getBookPdfStream(id: string): Promise<{ stream: Readable; contentType: string; fileName: string }> {
    const book = await this.bookModel
      .findById(id)
      .where('isPublished').equals(true)
      .select('title driveFileId mimeType')
      .lean();

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.driveFileId) {
      throw new NotFoundException('No PDF file linked to this book');
    }

    const stream = await this.driveService.getFileStream(book.driveFileId);
    return {
      stream,
      contentType: book.mimeType || 'application/pdf',
      fileName: `${book.title}.pdf`,
    };
  }

  /**
   * Get book details by slug (Quick View)
   */
  async getBookBySlug(slug: string) {
    const book = await this.bookModel
      .findOne({ slug, isPublished: true })
      .select(
        '_id title subtitle description coverUrl priceCents currency previewPages totalPages categoryRef',
      )
      .populate('categoryRef', 'name slug')
      .lean();

    if (!book) {
      return null;
    }

    return {
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverUrl: book.coverUrl,
      priceCents: book.priceCents,
      currency: book.currency,
      previewPages: book.previewPages,
      totalPages: book.totalPages,
      category: book.categoryRef,
    };
  }
}
