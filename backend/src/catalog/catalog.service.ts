import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Category, CategoryDocument } from '../models/category.schema';
import { Purchase, PurchaseDocument, PurchaseStatus } from '../models/purchase.schema';
import { Review, ReviewDocument, ReviewStatus } from '../models/review.schema';
import { DriveService } from '../utils/drive.service';
import { Readable } from 'stream';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
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
        '_id title subtitle description coverUrl priceCents currency previewPages totalPages categoryRef prequelRef',
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
      prequelRef: book.prequelRef,
    };
  }

  /**
   * Get series info: prequel (the book this one is a sequel of) and sequels (books that have this as prequelRef)
   */
  async getSeries(bookId: string) {
    const book = await this.bookModel
      .findById(bookId)
      .where('isPublished').equals(true)
      .select('prequelRef')
      .lean();

    if (!book) {
      return { prequel: null, sequels: [] };
    }

    let prequel: {
      _id: Types.ObjectId;
      title: string;
      subtitle: string;
      description: string;
      coverUrl?: string;
      priceCents: number;
      currency: string;
    } | null = null;
    if (book.prequelRef) {
      const p = await this.bookModel
        .findById(book.prequelRef)
        .where('isPublished').equals(true)
        .select('_id title subtitle description coverUrl priceCents currency')
        .lean();
      if (p) {
        prequel = {
          _id: p._id,
          title: p.title,
          subtitle: p.subtitle || '',
          description: p.description || '',
          coverUrl: p.coverUrl,
          priceCents: p.priceCents,
          currency: p.currency,
        };
      }
    }

    const sequels = await this.bookModel
      .find({ prequelRef: new Types.ObjectId(bookId), isPublished: true })
      .select('_id title subtitle description coverUrl priceCents currency')
      .sort({ publishedAt: -1 })
      .lean();

    return {
      prequel,
      sequels: sequels.map((s) => ({
        _id: s._id,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        coverUrl: s.coverUrl,
        priceCents: s.priceCents,
        currency: s.currency,
      })),
    };
  }

  /**
   * Get book recommendations based on category, popularity, and user history
   */
  async getRecommendations(bookId: string, userId?: string) {
    const book = await this.bookModel
      .findById(bookId)
      .where('isPublished').equals(true)
      .select('categoryRef title')
      .lean();

    if (!book) {
      return [];
    }

    // Gather candidate books: same category, excluding current book
    const candidates = await this.bookModel
      .find({
        _id: { $ne: new Types.ObjectId(bookId) },
        isPublished: true,
      })
      .select('_id title subtitle description coverUrl priceCents currency categoryRef views sales')
      .lean();

    // Get purchase counts for popularity scoring
    const bookIds = candidates.map(c => c._id);
    const purchaseCounts = await this.purchaseModel.aggregate([
      { $match: { bookRef: { $in: bookIds }, status: PurchaseStatus.PAID } },
      { $group: { _id: '$bookRef', count: { $sum: 1 } } },
    ]);
    const purchaseMap = new Map(purchaseCounts.map(p => [p._id.toString(), p.count]));

    // Get average ratings
    const ratings = await this.reviewModel.aggregate([
      { $match: { bookRef: { $in: bookIds }, status: ReviewStatus.APPROVED } },
      { $group: { _id: '$bookRef', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const ratingMap = new Map(ratings.map(r => [r._id.toString(), { avg: r.avgRating, count: r.count }]));

    // Get users who bought this book (for collaborative filtering)
    let sameUserBooks: Set<string> = new Set();
    if (userId) {
      const currentBuyers = await this.purchaseModel
        .find({ bookRef: new Types.ObjectId(bookId), status: PurchaseStatus.PAID })
        .distinct('userRef');
      if (currentBuyers.length > 0) {
        const alsoBought = await this.purchaseModel
          .find({
            userRef: { $in: currentBuyers },
            bookRef: { $ne: new Types.ObjectId(bookId), $in: bookIds },
            status: PurchaseStatus.PAID,
          })
          .distinct('bookRef');
        sameUserBooks = new Set(alsoBought.map(b => b.toString()));
      }
    }

    // Score and rank candidates
    const scored = candidates.map(c => {
      const id = c._id.toString();
      let score = 0;

      // Same category = strong signal
      if (c.categoryRef && book.categoryRef && c.categoryRef.toString() === book.categoryRef.toString()) {
        score += 50;
      }

      // Collaborative: users who bought this also bought that
      if (sameUserBooks.has(id)) {
        score += 30;
      }

      // Popularity: purchases
      const purchases = purchaseMap.get(id) || 0;
      score += Math.min(purchases * 5, 20);

      // Views
      score += Math.min((c.views || 0) / 10, 10);

      return {
        _id: id,
        title: c.title,
        subtitle: c.subtitle || '',
        description: c.description || '',
        coverUrl: c.coverUrl || '',
        priceCents: c.priceCents,
        currency: c.currency,
        categoryRef: c.categoryRef,
        purchases,
        avgRating: ratingMap.get(id)?.avg ? Math.round(ratingMap.get(id)!.avg * 10) / 10 : 0,
        reviewCount: ratingMap.get(id)?.count || 0,
        relevanceScore: Math.min(Math.round(score / 10), 5),
      };
    });

    // Sort by score descending, limit to 8
    return scored.sort((a, b) => {
      const scoreA = b.purchases - a.purchases;
      const scoreB = a.relevanceScore - b.relevanceScore;
      return b.relevanceScore - a.relevanceScore || b.purchases - a.purchases;
    }).slice(0, 8);
  }

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
   * Get a subset of PDF pages with access control
   * Non-purchased users can only access up to previewPages
   * Purchased users can access any range
   */
  async getBookPageRange(
    bookId: string,
    startPage: number,
    endPage: number,
    userId?: string,
  ) {
    const book = await this.bookModel
      .findById(bookId)
      .where('isPublished').equals(true)
      .select('title driveFileId mimeType previewPages totalPages')
      .lean();

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.driveFileId) {
      throw new NotFoundException('No PDF file linked to this book');
    }

    // Validate page range
    const total = book.totalPages || 0;
    const s = Math.max(1, startPage);
    const e = Math.min(total, endPage);

    if (s > e || s > total) {
      throw new NotFoundException('Invalid page range');
    }

    // Limit range size — max 3 pages per request for fast loading
    if (e - s + 1 > 3) {
      throw new NotFoundException('Page range too large (max 20)');
    }

    // Check access: non-purchased users limited to previewPages
    const maxAllowed = book.previewPages || 10;
    if (s > maxAllowed || e > maxAllowed) {
      if (!userId) {
        throw new NotFoundException('Compra el libro para acceder a más páginas');
      }
      const purchase = await this.purchaseModel
        .findOne({ userRef: new Types.ObjectId(userId), bookRef: new Types.ObjectId(bookId), status: PurchaseStatus.PAID })
        .lean();
      if (!purchase) {
        throw new NotFoundException('Compra el libro para acceder a más páginas');
      }
    }

    // Download full PDF from Drive
    const pdfBuffer = await this.driveService.downloadFileAsBuffer(book.driveFileId);

    // Extract page range using pdf-lib
    const { PDFDocument } = await import('pdf-lib');
    const fullPdf = await PDFDocument.load(pdfBuffer);
    const subsetPdf = await PDFDocument.create();

    const pages = await subsetPdf.copyPages(fullPdf, Array.from({ length: e - s + 1 }, (_, i) => s - 1 + i));
    pages.forEach((p) => subsetPdf.addPage(p));

    const pdfBytes = await subsetPdf.save();
    return Buffer.from(pdfBytes);
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
