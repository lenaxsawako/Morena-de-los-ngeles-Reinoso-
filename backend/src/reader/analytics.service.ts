import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReadingSession, ReadingSessionDocument } from '../models/reading-session.schema';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { Book, BookDocument } from '../models/book.schema';
import { Types } from 'mongoose';

interface ActivitySummary {
  totalSessions: number;
  totalPagesRead: number;
  totalReadingTime: number;
  averageSessionTime: number;
  booksInProgress: number;
  booksFinished: number;
}

interface ActivityChartData {
  label: string;
  sessions: number;
  pagesRead: number;
  readingTime: number;
}

interface TopBook {
  bookId: string;
  title: string;
  coverUrl: string | null;
  pagesRead: number;
  progressPercentage: number;
  lastReadAt: Date;
}

export interface ReaderActivityResponse {
  period: string;
  summary: ActivitySummary;
  chart: ActivityChartData[];
  topBooks: TopBook[];
}

export interface StatsResponse {
  totalBooksFinished: number;
  totalBooksInProgress: number;
  totalPagesRead: number;
  totalReadingTime: number;
  averageReadingTime: number;
  favoriteCategory: string | null;
  longestBook: {
    bookId: string;
    title: string;
    pages: number;
  } | null;
  recentBooks: Array<{
    bookId: string;
    title: string;
    progressPercentage: number;
    lastReadAt: Date;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(ReadingSession.name)
    private readingSessionModel: Model<ReadingSessionDocument>,
    @InjectModel(ReadingProgress.name)
    private readingProgressModel: Model<ReadingProgressDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
  ) {}

  /**
   * Record a reading session when progress is updated
   */
  async recordSession(
    userId: string,
    bookId: string,
    startPage: number,
    endPage: number,
    durationMinutes: number,
  ): Promise<ReadingSessionDocument> {
    const pagesRead = Math.max(0, endPage - startPage);

    const session = new this.readingSessionModel({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
      startPage,
      endPage,
      pagesRead,
      durationMinutes,
      sessionStartAt: new Date(),
      sessionEndAt: new Date(),
    });

    return session.save();
  }

  /**
   * Get activity data for a given period
   */
  async getActivityData(
    userId: string,
    periodDays: number = 7,
  ): Promise<ReaderActivityResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const userObjectId = new Types.ObjectId(userId);

    // Get all sessions for the period
    const sessions = await this.readingSessionModel
      .find({
        userRef: userObjectId,
        sessionStartAt: { $gte: startDate },
      })
      .populate('bookRef', 'title coverUrl totalPages')
      .exec();

    // Group sessions by day
    const dailyData = new Map<string, ActivityChartData>();

    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      dailyData.set(dateStr, {
        label: dateStr,
        sessions: 0,
        pagesRead: 0,
        readingTime: 0,
      });
    }

    // Aggregate session data
    let totalPagesRead = 0;
    let totalReadingTime = 0;

    sessions.forEach((session) => {
      const dateStr = session.sessionStartAt.toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr);

      if (dayData) {
        dayData.sessions += 1;
        dayData.pagesRead += session.pagesRead;
        dayData.readingTime += session.durationMinutes;
      }

      totalPagesRead += session.pagesRead;
      totalReadingTime += session.durationMinutes;
    });

    // Get top books in this period
    const topBooksAgg = await this.readingSessionModel.aggregate([
      {
        $match: {
          userRef: userObjectId,
          sessionStartAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$bookRef',
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

    const topBooks: TopBook[] = [];

    for (const item of topBooksAgg) {
      const book = await this.bookModel
        .findById(item._id)
        .select('title coverUrl totalPages')
        .exec();

      const progress = await this.readingProgressModel.findOne({
        userRef: userObjectId,
        bookRef: item._id,
      });

      if (book && progress) {
        topBooks.push({
          bookId: book._id.toString(),
          title: book.title,
          coverUrl: book.coverUrl || null,
          pagesRead: item.pagesRead,
          progressPercentage: progress.progressPercentage,
          lastReadAt: progress.lastReadAt,
        });
      }
    }

    // Get reading progress stats
    const progressStats = await this.readingProgressModel.aggregate([
      {
        $match: { userRef: userObjectId },
      },
      {
        $facet: {
          inProgress: [
            { $match: { progressPercentage: { $lt: 100 } } },
            { $count: 'count' },
          ],
          finished: [
            { $match: { progressPercentage: { $eq: 100 } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const booksInProgress =
      progressStats[0]?.inProgress[0]?.count || 0;
    const booksFinished = progressStats[0]?.finished[0]?.count || 0;

    const summary: ActivitySummary = {
      totalSessions: sessions.length,
      totalPagesRead,
      totalReadingTime,
      averageSessionTime:
        sessions.length > 0
          ? Math.round(totalReadingTime / sessions.length)
          : 0,
      booksInProgress,
      booksFinished,
    };

    const period = periodDays === 7 ? '7d' : periodDays === 30 ? '30d' : '90d';

    return {
      period,
      summary,
      chart: Array.from(dailyData.values()),
      topBooks,
    };
  }

  /**
   * Get overall reading statistics for the user
   */
  async getStats(userId: string): Promise<StatsResponse> {
    const userObjectId = new Types.ObjectId(userId);

    // Get all reading progress
    const allProgress = await this.readingProgressModel
      .find({ userRef: userObjectId })
      .populate('bookRef', 'title totalPages categoryRef')
      .exec();

    // Count finished and in progress books
    const booksFinished = allProgress.filter(
      (p) => p.progressPercentage === 100,
    ).length;
    const booksInProgress = allProgress.filter(
      (p) => p.progressPercentage < 100,
    ).length;

    // Calculate total pages read
    const allSessions = await this.readingSessionModel
      .find({ userRef: userObjectId })
      .exec();

    const totalPagesRead = allSessions.reduce(
      (sum, session) => sum + session.pagesRead,
      0,
    );
    const totalReadingTime = allSessions.reduce(
      (sum, session) => sum + session.durationMinutes,
      0,
    );

    const averageReadingTime =
      allProgress.length > 0
        ? Math.round(totalReadingTime / allProgress.length)
        : 0;

    // Get favorite category
    const categoryAgg = await this.readingProgressModel.aggregate([
      { $match: { userRef: userObjectId } },
      {
        $lookup: {
          from: 'books',
          localField: 'bookRef',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $lookup: {
          from: 'categories',
          localField: 'book.categoryRef',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const favoriteCategory =
      categoryAgg.length > 0 ? categoryAgg[0]._id : null;

    // Get longest book
    let longestBook: {
      bookId: string;
      title: string;
      pages: number;
    } | null = null;
    if (allProgress.length > 0) {
      const longest = allProgress.reduce((max, p) => {
        const maxPages = (max.bookRef as any)?.totalPages || 0;
        const currentPages = (p.bookRef as any)?.totalPages || 0;
        return currentPages > maxPages ? p : max;
      });

      if ((longest.bookRef as any)?.totalPages) {
        longestBook = {
          bookId: (longest.bookRef as any)._id.toString(),
          title: (longest.bookRef as any).title,
          pages: (longest.bookRef as any).totalPages,
        };
      }
    }

    // Get recent books (last 5 accessed)
    const recentBooksData = await this.readingProgressModel
      .find({ userRef: userObjectId })
      .populate('bookRef', 'title')
      .sort({ lastReadAt: -1 })
      .limit(5)
      .exec();

    const recentBooks = recentBooksData.map((p) => ({
      bookId: (p.bookRef as any)._id.toString(),
      title: (p.bookRef as any).title,
      progressPercentage: p.progressPercentage,
      lastReadAt: p.lastReadAt,
    }));

    return {
      totalBooksFinished: booksFinished,
      totalBooksInProgress: booksInProgress,
      totalPagesRead,
      totalReadingTime,
      averageReadingTime,
      favoriteCategory,
      longestBook,
      recentBooks,
    };
  }
}
