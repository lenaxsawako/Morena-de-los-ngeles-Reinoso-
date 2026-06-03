import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { Bookmark, BookmarkDocument } from '../models/bookmark.schema';
import { Book, BookDocument } from '../models/book.schema';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Purchase.name)
    private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(ReadingProgress.name)
    private readingProgressModel: Model<ReadingProgressDocument>,
    @InjectModel(Bookmark.name)
    private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
  ) {}

  /**
   * Get all books purchased by a user with reading progress
   */
  async getUserLibrary(userId: string) {
    const purchases = await this.purchaseModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef')
      .sort({ createdAt: -1 });

    const bookIds = purchases.map((p) => p.bookRef._id);

    // Get reading progress for all books
    const progressMap = new Map();
    const progressList = await this.readingProgressModel.find({
      userRef: new Types.ObjectId(userId),
      bookRef: { $in: bookIds },
    });

    progressList.forEach((p) => {
      progressMap.set(p.bookRef.toString(), p);
    });

    // Combine data
    return purchases.map((purchase) => {
      const book = purchase.bookRef as any;
      const progress = progressMap.get(book._id.toString());

      return {
        bookId: book._id,
        title: book.title,
        slug: book.slug,
        description: book.description,
        coverUrl: book.coverUrl,
        currentPage: progress?.currentPage || 1,
        progressPercentage: progress?.progressPercentage || 0,
        lastReadAt: progress?.lastReadAt || null,
        purchasedAt: (purchase as any).createdAt,
      };
    });
  }

  /**
   * Get reading stats for a user
   */
  async getReadingStats(userId: string) {
    const progressList = await this.readingProgressModel.find({
      userRef: new Types.ObjectId(userId),
    });

    const totalBooks = progressList.length;
    const booksInProgress = progressList.filter((p) => p.progressPercentage > 0 && p.progressPercentage < 100).length;
    const booksFinished = progressList.filter((p) => p.progressPercentage === 100).length;
    const averageProgress = totalBooks > 0 ? Math.round(progressList.reduce((sum, p) => sum + p.progressPercentage, 0) / totalBooks) : 0;

    return {
      totalBooks,
      booksInProgress,
      booksFinished,
      averageProgress,
      lastReadAt: progressList.length > 0 ? progressList.sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime())[0].lastReadAt : null,
    };
  }

  /**
   * Get a single book with progress details
   */
  async getBookDetail(userId: string, bookId: string) {
    const purchase = await this.purchaseModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    if (!purchase) {
      return null;
    }

    const book = await this.bookModel.findById(bookId);
    if (!book) {
      return null;
    }

    const progress = await this.readingProgressModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    return {
      bookId: book._id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      coverUrl: book.coverUrl,
      authorRef: book.authorRef,
      driveFileId: book.driveFileId,
      currentPage: progress?.currentPage || 1,
      progressPercentage: progress?.progressPercentage || 0,
      lastReadAt: progress?.lastReadAt || null,
      purchasedAt: (purchase as any).createdAt,
    };
  }

  /**
   * Get the book user is currently reading (most recently opened)
   * Returns null if no book is being read
   */
  async getContinueReading(userId: string): Promise<any> {
    const progress = await this.readingProgressModel
      .findOne({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', 'title coverUrl totalPages')
      .sort({ lastReadAt: -1 })
      .lean();

    if (!progress) {
      return null;
    }

    const book = progress.bookRef as any;
    const totalPages = book.totalPages || 300;
    const remainingPages = totalPages - progress.currentPage;

    return {
      bookId: book._id,
      title: book.title,
      coverUrl: book.coverUrl,
      currentPage: progress.currentPage,
      progressPercentage: progress.progressPercentage,
      remainingPages: remainingPages > 0 ? remainingPages : 0,
      lastReadAt: progress.lastReadAt,
    };
  }

  /**
   * Get user's book collection with status
   * Status: unread (0%), reading (1-99%), completed (100%)
   */
  async getCollection(userId: string) {
    const purchases = await this.purchaseModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', 'title coverUrl slug')
      .sort({ createdAt: -1 });

    const bookIds = purchases.map((p) => p.bookRef._id);

    // Get reading progress for all books
    const progressMap = new Map();
    const progressList = await this.readingProgressModel.find({
      userRef: new Types.ObjectId(userId),
      bookRef: { $in: bookIds },
    });

    progressList.forEach((p) => {
      progressMap.set(p.bookRef.toString(), p);
    });

    // Map status based on percentage
    const getStatus = (percentage: number): string => {
      if (percentage === 0) return 'unread';
      if (percentage < 100) return 'reading';
      return 'completed';
    };

    return purchases.map((purchase) => {
      const book = purchase.bookRef as any;
      const progress = progressMap.get(book._id.toString());
      const percentage = progress?.progressPercentage || 0;

      return {
        bookId: book._id,
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        progressPercentage: percentage,
        status: getStatus(percentage),
      };
    });
  }

  /**
   * Get recently opened books sorted by lastReadAt DESC
   */
  async getRecentlyOpened(userId: string, limit: number = 5) {
    const progressList = await this.readingProgressModel
      .find({ userRef: new Types.ObjectId(userId), lastReadAt: { $ne: null } })
      .populate('bookRef', 'title coverUrl slug')
      .sort({ lastReadAt: -1 })
      .limit(limit);

    return progressList.map((p) => {
      const book = p.bookRef as any;
      return {
        bookId: book._id,
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        currentPage: p.currentPage,
        progressPercentage: p.progressPercentage,
        lastReadAt: p.lastReadAt,
      };
    });
  }

  /**
   * Get favorite books (books with at least one bookmark)
   */
  async getFavorites(userId: string) {
    // Get unique bookIds that have bookmarks
    const bookmarksByBook = await this.bookmarkModel.aggregate([
      { $match: { userRef: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$bookRef',
          bookmarkCount: { $sum: 1 },
        },
      },
    ]);

    if (bookmarksByBook.length === 0) {
      return [];
    }

    const bookIds = bookmarksByBook.map((b) => b._id);
    const books = await this.bookModel.find({ _id: { $in: bookIds } }).select('_id title coverUrl slug');

    // Get reading progress for these books
    const progressMap = new Map();
    const progressList = await this.readingProgressModel.find({
      userRef: new Types.ObjectId(userId),
      bookRef: { $in: bookIds },
    });

    progressList.forEach((p) => {
      progressMap.set(p.bookRef.toString(), p);
    });

    return books.map((book) => {
      const progress = progressMap.get(book._id.toString());
      const bookmarkCount = bookmarksByBook.find((b) => b._id.toString() === book._id.toString())?.bookmarkCount || 0;

      return {
        bookId: book._id,
        title: book.title,
        slug: book.slug,
        coverUrl: book.coverUrl,
        progressPercentage: progress?.progressPercentage || 0,
        bookmarkCount,
      };
    });
  }

  /**
   * Sync guest progress with authenticated user's progress
   * Merges guest data without overwriting newer backend progress
   */
  async syncGuestProgress(userId: string, guestProgressData: Array<any>) {
    const results: any[] = [];

    for (const guestData of guestProgressData) {
      const { bookId, currentPage, progressPercentage, lastReadAt } = guestData;

      // Get or create existing progress
      let existingProgress = await this.readingProgressModel.findOne({
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
      });

      const guestReadAt = new Date(lastReadAt);

      if (!existingProgress) {
        // Create new progress record
        const newProgress = await this.readingProgressModel.create({
          userRef: new Types.ObjectId(userId),
          bookRef: new Types.ObjectId(bookId),
          currentPage,
          progressPercentage,
          lastReadAt: guestReadAt,
        });

        results.push({
          bookId,
          action: 'created',
          currentPage: newProgress.currentPage,
          progressPercentage: newProgress.progressPercentage,
        });
      } else {
        // Only update if guest progress is newer
        if (guestReadAt > existingProgress.lastReadAt) {
          existingProgress.currentPage = currentPage;
          existingProgress.progressPercentage = progressPercentage;
          existingProgress.lastReadAt = guestReadAt;
          await existingProgress.save();

          results.push({
            bookId,
            action: 'updated',
            currentPage: existingProgress.currentPage,
            progressPercentage: existingProgress.progressPercentage,
          });
        } else {
          results.push({
            bookId,
            action: 'skipped',
            reason: 'Backend progress is newer',
          });
        }
      }
    }

    return {
      synced: results.length,
      details: results,
    };
  }

  /**
   * Get dashboard combining continue reading and collection
   */
  async getDashboard(userId: string) {
    const [continueReading, collection] = await Promise.all([
      this.getContinueReading(userId),
      this.getCollection(userId),
    ]);

    return {
      continueReading,
      collection,
    };
  }
}
