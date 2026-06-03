import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingProgress, ReadingProgressSchema } from '../models/reading-progress.schema';
import { Bookmark, BookmarkSchema } from '../models/bookmark.schema';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { ReadingSession, ReadingSessionSchema } from '../models/reading-session.schema';
import { ReadingProgressService } from './reading-progress.service';
import { BookmarkService } from './bookmark.service';
import { LibraryService } from './library.service';
import { AnalyticsService } from './analytics.service';
import { ReadingProgressController } from './reading-progress.controller';
import { BookmarkController } from './bookmark.controller';
import { LibraryController } from './library.controller';
import { AnalyticsController } from './analytics.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ReadingProgress.name,
        schema: ReadingProgressSchema,
      },
      {
        name: Bookmark.name,
        schema: BookmarkSchema,
      },
      {
        name: Book.name,
        schema: BookSchema,
      },
      {
        name: Purchase.name,
        schema: PurchaseSchema,
      },
      {
        name: ReadingSession.name,
        schema: ReadingSessionSchema,
      },
    ]),
    SharedModule,
  ],
  providers: [ReadingProgressService, BookmarkService, LibraryService, AnalyticsService],
  controllers: [ReadingProgressController, BookmarkController, LibraryController, AnalyticsController],
  exports: [ReadingProgressService, BookmarkService, LibraryService, AnalyticsService],
})
export class ReaderModule {}
