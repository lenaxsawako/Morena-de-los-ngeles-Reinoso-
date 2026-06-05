import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { User, UserSchema } from '../models/user.schema';
import { ReadingProgress, ReadingProgressSchema } from '../models/reading-progress.schema';
import { ReadingSession, ReadingSessionSchema } from '../models/reading-session.schema';
import { Review, ReviewSchema } from '../models/review.schema';
import { Category, CategorySchema } from '../models/category.schema';
import { SiteConfig, SiteConfigSchema } from '../models/site-config.schema';
import { Subscription, SubscriptionSchema } from '../models/subscription.schema';
import { Coupon, CouponSchema } from '../models/coupon.schema';
import { AdminBooksService } from './admin-books.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminReportingService } from './admin-reporting.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminSettingsService } from './admin-settings.service';
import { AdminBooksController, AdminDashboardController } from './admin-books.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminCommunityController, AdminReviewsController, AdminReadersController } from './admin-community.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCouponsController } from './admin-coupons.controller';
import { DriveService } from '../utils/drive.service';
import { CloudinaryService } from '../utils/cloudinary.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: User.name, schema: UserSchema },
      { name: ReadingProgress.name, schema: ReadingProgressSchema },
      { name: ReadingSession.name, schema: ReadingSessionSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SiteConfig.name, schema: SiteConfigSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
  ],
  controllers: [
    AdminBooksController,
    AdminDashboardController,
    AdminAnalyticsController,
    AdminCommunityController,
    AdminReviewsController,
    AdminReadersController,
    AdminSettingsController,
    AdminCategoriesController,
    AdminCouponsController,
  ],
  providers: [
    AdminBooksService,
    AdminAnalyticsService,
    AdminReportingService,
    AdminCommunityService,
    AdminSettingsService,
    DriveService,
  ],
  exports: [
    AdminBooksService,
    AdminAnalyticsService,
    AdminReportingService,
    AdminCommunityService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
