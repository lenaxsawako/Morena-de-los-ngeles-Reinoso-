import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument, PurchaseStatus } from '../models/purchase.schema';
import { Book, BookDocument } from '../models/book.schema';
import { User, UserDocument } from '../models/user.schema';
import { ReadingSession, ReadingSessionDocument } from '../models/reading-session.schema';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { TransactionalService } from './transactional.service';
import { RedisStoreService } from '../services/redis-store.service';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const REMINDER_CACHE_PREFIX = 'reminder:sent:';

@Injectable()
export class ReadingReminderCron {
  private readonly logger = new Logger(ReadingReminderCron.name);

  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ReadingSession.name) private readingSessionModel: Model<ReadingSessionDocument>,
    @InjectModel(ReadingProgress.name) private readingProgressModel: Model<ReadingProgressDocument>,
    private transactionalService: TransactionalService,
    private redisStore: RedisStoreService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendReadingReminders() {
    this.logger.log('Running reading reminder cron...');

    const sevenDaysAgo = new Date(Date.now() - WEEK_MS);

    // Find purchases older than 7 days with no recent reading session
    const purchases = await this.purchaseModel.aggregate([
      { $match: { status: PurchaseStatus.PAID, paidAt: { $lte: sevenDaysAgo } } },
      {
        $lookup: {
          from: 'readingsessions',
          let: { userId: '$userRef', bookId: '$bookRef' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userRef', '$$userId'] },
                    { $eq: ['$bookRef', '$$bookId'] },
                    { $gte: ['$sessionStartAt', sevenDaysAgo] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'recentSessions',
        },
      },
      { $match: { recentSessions: { $size: 0 } } },
      { $limit: 50 },
    ]);

    if (purchases.length === 0) {
      this.logger.log('No reading reminders to send');
      return;
    }

    let sent = 0;
    for (const purchase of purchases) {
      try {
        const cacheKey = `${REMINDER_CACHE_PREFIX}${purchase.userRef}:${purchase.bookRef}`;
        const alreadySent = await this.redisStore.get(cacheKey);
        if (alreadySent) continue;

        const [user, book, progress] = await Promise.all([
          this.userModel.findById(purchase.userRef).select('email profile').lean(),
          this.bookModel.findById(purchase.bookRef).select('title coverUrl').lean(),
          this.readingProgressModel.findOne({
            userRef: purchase.userRef,
            bookRef: purchase.bookRef,
          }).lean(),
        ]);

        if (!user?.email || !book) continue;

        const name = user.profile?.username || user.email.split('@')[0];
        const progressPercentage = progress?.progressPercentage || 0;

        await this.transactionalService.sendReadingReminder(
          user.email,
          name,
          book.title,
          book._id.toString(),
          progressPercentage,
          book.coverUrl,
        );

        await this.redisStore.set(cacheKey, '1', WEEK_MS);
        sent++;
      } catch (err: any) {
        this.logger.error(`Error sending reminder for purchase ${purchase._id}: ${err.message}`);
      }
    }

    this.logger.log(`Reading reminders sent: ${sent}/${purchases.length}`);
  }
}
