import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { User, UserDocument } from '../models/user.schema';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { ReadingSession, ReadingSessionDocument } from '../models/reading-session.schema';

export interface AdminActivityResponse {
  period: string;
  summary: {
    totalActiveSessions: number;
    totalPagesReadPlatform: number;
    totalReadingTimePlatform: number;
    averageSessionTime: number;
    activeReaderCount: number;
  };
  chart: Array<{
    label: string;
    sessions: number;
    pagesRead: number;
    readingTime: number;
    activeReaders: number;
  }>;
  topBooks: Array<{
    bookId: string;
    title: string;
    sessionsCount: number;
    pagesRead: number;
  }>;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ReadingProgress.name) private readingProgressModel: Model<ReadingProgressDocument>,
    @InjectModel(ReadingSession.name) private readingSessionModel: Model<ReadingSessionDocument>,
  ) {}

  /**
   * Get admin dashboard with summary, recent activity, and books overview
   */
  async getDashboard() {
    const [summary, recentActivity, books] = await Promise.all([
      this.getSummary(),
      this.getRecentActivity(),
      this.getLatestBooks(),
    ]);

    return {
      summary,
      recentActivity,
      books,
    };
  }

  /**
   * Get summary metrics for dashboard
   */
  async getSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [
      totalSales,
      publishedBooks,
      monthlyPurchases,
      activeReadersData,
    ] = await Promise.all([
      this.purchaseModel.countDocuments(),
      this.bookModel.countDocuments({ isPublished: true }),
      this.purchaseModel.find({ createdAt: { $gte: currentMonthStart } }).select('priceCents').lean(),
      this.readingProgressModel.find({ lastReadAt: { $gte: thirtyDaysAgo } }).distinct('userRef'),
    ]);

    const monthlyRevenue = monthlyPurchases.reduce((sum, p: any) => sum + (p.priceCents || 0), 0);

    return {
      totalSales,
      activeReaders: activeReadersData.length,
      publishedBooks,
      monthlyRevenue: parseFloat((monthlyRevenue / 100).toFixed(2)),
    };
  }

  /**
   * Get recent activity (purchases and registrations)
   */
  async getRecentActivity() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [purchases, registrations] = await Promise.all([
      this.purchaseModel
        .find({ createdAt: { $gte: thirtyDaysAgo } })
        .select('bookRef createdAt')
        .populate('bookRef', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      this.userModel
        .find({ createdAt: { $gte: thirtyDaysAgo } })
        .select('email createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const activity: any[] = [];

    // Add purchases
    purchases.forEach((p: any) => {
      activity.push({
        type: 'purchase',
        title: 'New Purchase',
        description: `${p.bookRef?.title || 'Book'} purchased`,
        createdAt: p.createdAt,
      });
    });

    // Add registrations
    registrations.forEach((u: any) => {
      activity.push({
        type: 'registration',
        title: 'New User',
        description: `${u.email} registered`,
        createdAt: u.createdAt,
      });
    });

    // Sort by date and limit to 10
    return activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }

  /**
   * Get latest published books overview
   */
  async getLatestBooks() {
    const purchases = await this.purchaseModel.find().select('bookRef').lean();
    const bookSalesCounts = new Map<string, number>();

    purchases.forEach((p: any) => {
      const bookId = p.bookRef?.toString();
      if (bookId) {
        bookSalesCounts.set(bookId, (bookSalesCounts.get(bookId) || 0) + 1);
      }
    });

    const books = await this.bookModel
      .find({ isPublished: true })
      .select('_id title coverUrl priceCents')
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean();

    return books.map((book: any) => ({
      _id: book._id,
      title: book.title,
      coverUrl: book.coverUrl,
      priceCents: book.priceCents,
      sales: bookSalesCounts.get(book._id?.toString()) || 0,
      status: 'published',
    }));
  }

  /**
   * Get detailed analytics for a specific book
   */
  async getBookAnalytics(bookId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [book, purchaseData, readingData] = await Promise.all([
      this.bookModel.findById(bookId).lean(),
      this.purchaseModel
        .find({ bookRef: bookId })
        .select('priceCents')
        .lean(),
      this.readingProgressModel
        .find({ bookRef: bookId, lastReadAt: { $gte: thirtyDaysAgo } })
        .select('currentPage totalPages')
        .lean(),
    ]);

    if (!book) {
      return null;
    }

    const sales = purchaseData.length;
    const revenue = purchaseData.reduce((sum, p: any) => sum + (p.priceCents || 0), 0) / 100;
    const readers = readingData.length;
    const views = book.views || 0;

    // Calculate conversion rate (readers who purchased / total views)
    const conversionRate = views > 0 ? parseFloat(((readers / views) * 100).toFixed(1)) : 0;

    // Calculate average reading progress
    const averageProgress =
      readers > 0
        ? parseFloat(
            (
              readingData.reduce((sum, r: any) => sum + ((r.currentPage / r.totalPages) * 100 || 0), 0) /
              readers
            ).toFixed(1),
          )
        : 0;

    return {
      sales,
      revenue: parseFloat(revenue.toFixed(2)),
      readers,
      conversionRate,
      averageProgress,
    };
  }

  /**
   * Get platform-wide reading activity for admin dashboard
   */
  async getActivityData(periodDays: number = 7): Promise<AdminActivityResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all sessions for the period
    const sessions = await this.readingSessionModel
      .find({
        sessionStartAt: { $gte: startDate },
      })
      .populate('bookRef', 'title')
      .lean()
      .exec();

    // Group sessions by day
    const dailyData = new Map<string, any>();

    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      dailyData.set(dateStr, {
        label: dateStr,
        sessions: 0,
        pagesRead: 0,
        readingTime: 0,
        activeReaders: new Set<string>(),
      });
    }

    // Aggregate session data
    let totalPagesRead = 0;
    let totalReadingTime = 0;
    const activeReaderIds = new Set<string>();

    sessions.forEach((session: any) => {
      const dateStr = session.sessionStartAt.toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr);

      if (dayData) {
        dayData.sessions += 1;
        dayData.pagesRead += session.pagesRead;
        dayData.readingTime += session.durationMinutes;
        dayData.activeReaders.add(session.userRef.toString());
        activeReaderIds.add(session.userRef.toString());
      }

      totalPagesRead += session.pagesRead;
      totalReadingTime += session.durationMinutes;
    });

    // Get top books in this period
    const topBooksAgg = await this.readingSessionModel.aggregate([
      {
        $match: {
          sessionStartAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$bookRef',
          sessionsCount: { $sum: 1 },
          pagesRead: { $sum: '$pagesRead' },
        },
      },
      {
        $sort: { pagesRead: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const topBooks: Array<{
      bookId: string;
      title: string;
      sessionsCount: number;
      pagesRead: number;
    }> = [];
    for (const item of topBooksAgg) {
      const book = await this.bookModel
        .findById(item._id)
        .select('title')
        .lean()
        .exec();

      if (book) {
        topBooks.push({
          bookId: book._id.toString(),
          title: book.title,
          sessionsCount: item.sessionsCount,
          pagesRead: item.pagesRead,
        });
      }
    }

    const summary = {
      totalActiveSessions: sessions.length,
      totalPagesReadPlatform: totalPagesRead,
      totalReadingTimePlatform: totalReadingTime,
      averageSessionTime:
        sessions.length > 0
          ? Math.round(totalReadingTime / sessions.length)
          : 0,
      activeReaderCount: activeReaderIds.size,
    };

    const period = periodDays === 7 ? '7d' : periodDays === 30 ? '30d' : '90d';

    // Convert chart data to array with activeReaders count
    const chart = Array.from(dailyData.values()).map((day) => ({
      label: day.label,
      sessions: day.sessions,
      pagesRead: day.pagesRead,
      readingTime: day.readingTime,
      activeReaders: day.activeReaders.size,
    }));

    return {
      period,
      summary,
      chart,
      topBooks,
    };
  }
}
