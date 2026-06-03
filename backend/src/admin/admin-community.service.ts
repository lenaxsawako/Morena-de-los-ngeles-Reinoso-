import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from '../models/review.schema';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { User, UserDocument } from '../models/user.schema';
import { Book, BookDocument } from '../models/book.schema';

@Injectable()
export class AdminCommunityService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ReadingProgress.name) private readingProgressModel: Model<ReadingProgressDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  /**
   * Get complete community dashboard
   */
  async getDashboard() {
    const [summary, activity, topReaders, latestReviews] = await Promise.all([
      this.getSummary(),
      this.getActivity('monthly'),
      this.getTopReaders(),
      this.getLatestReviews(1, 10),
    ]);

    return {
      summary,
      activity: activity.items,
      topReaders: topReaders.items,
      latestReviews: latestReviews.items,
    };
  }

  /**
   * Get community summary metrics
   */
  async getSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalReaderData, newsletterCount, reviewData, averageRatingData] = await Promise.all([
      // Count unique users with purchases or reading activity
      this.userModel.aggregate([
        {
          $facet: {
            purchased: [
              {
                $lookup: {
                  from: 'purchases',
                  localField: '_id',
                  foreignField: 'userRef',
                  as: 'purchases',
                },
              },
              {
                $match: {
                  purchases: { $ne: [] },
                },
              },
              {
                $count: 'count',
              },
            ],
            reading: [
              {
                $lookup: {
                  from: 'readingprogresses',
                  localField: '_id',
                  foreignField: 'userRef',
                  as: 'reading',
                },
              },
              {
                $match: {
                  reading: { $ne: [] },
                },
              },
              {
                $count: 'count',
              },
            ],
          },
        },
      ]),
      // Count newsletter subscribers
      this.userModel.countDocuments({ newsletterSubscribed: true }),
      // Count approved reviews
      this.reviewModel.countDocuments({ status: ReviewStatus.APPROVED }),
      // Average rating
      this.reviewModel.aggregate([
        { $match: { status: ReviewStatus.APPROVED } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    // Extract unique reader count
    const purchasedUsers = new Set(
      (await this.purchaseModel.distinct('userRef')).map((id) => id.toString()),
    );
    const readingUsers = new Set(
      (await this.readingProgressModel.distinct('userRef')).map((id) => id.toString()),
    );
    const totalReaders = new Set([...purchasedUsers, ...readingUsers]).size;

    return {
      totalReaders,
      newsletterSubscribers: newsletterCount,
      reviewsCount: reviewData,
      averageRating: parseFloat((averageRatingData[0]?.averageRating || 0).toFixed(1)),
    };
  }

  /**
   * Get reader activity chart data
   */
  async getActivity(period: string) {
    const validPeriods = ['weekly', 'monthly'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    const startDate = this.getActivityStartDate(period);
    const groupFormat = period === 'weekly' ? '%Y-%U' : '%Y-%m-%d'; // Weekly or daily

    const activityData = await this.readingProgressModel.aggregate([
      {
        $match: {
          lastReadAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$lastReadAt',
            },
          },
          activeReaders: { $sum: 1 },
          readingSessions: { $sum: 1 }, // Each document represents a session
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      items: activityData.map((item) => ({
        label: item._id,
        activeReaders: item.activeReaders,
        readingSessions: item.readingSessions,
      })),
    };
  }

  /**
   * Get latest approved reviews with pagination
   */
  async getLatestReviews(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ status: ReviewStatus.APPROVED })
        .select('_id userRef bookRef rating content createdAt')
        .populate('userRef', 'name email')
        .populate('bookRef', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments({ status: ReviewStatus.APPROVED }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      items: reviews.map((review: any) => ({
        reviewId: review._id,
        userName: review.userRef?.name || review.userRef?.email || 'Anonymous',
        bookTitle: review.bookRef?.title || 'Unknown',
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
      })),
      total,
      page,
      pages,
    };
  }

  /**
   * Get top readers by books owned
   */
  async getTopReaders() {
    const topReadersData = await this.purchaseModel.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$userRef',
          booksOwned: { $sum: 1 },
        },
      },
      { $sort: { booksOwned: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);

    // Get average progress and last activity for each top reader
    const enrichedReaders = await Promise.all(
      topReadersData.map(async (reader) => {
        const [progressData, lastActivityData] = await Promise.all([
          this.readingProgressModel.aggregate([
            { $match: { userRef: reader._id } },
            {
              $group: {
                _id: null,
                averageProgress: { $avg: '$progressPercentage' },
              },
            },
          ]),
          this.readingProgressModel
            .findOne({ userRef: reader._id })
            .sort({ lastReadAt: -1 })
            .select('lastReadAt'),
        ]);

        return {
          userId: reader._id,
          name: reader.user.name || reader.user.email,
          booksOwned: reader.booksOwned,
          averageProgress: parseFloat((progressData[0]?.averageProgress || 0).toFixed(1)),
          lastActivity: lastActivityData?.lastReadAt || null,
        };
      }),
    );

    return {
      items: enrichedReaders,
    };
  }

  /**
   * Get activity start date based on period
   */
  private getActivityStartDate(period: string): Date {
    const now = new Date();

    if (period === 'weekly') {
      return new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000); // 8 weeks
    }
    // monthly - 12 months
    return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
  }
}
