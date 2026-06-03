import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReadingProgress, ReadingProgressDocument } from '../models/reading-progress.schema';
import { Book, BookDocument } from '../models/book.schema';
import { CreateReadingProgressDto } from './dto/create-reading-progress.dto';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectModel(ReadingProgress.name)
    private readingProgressModel: Model<ReadingProgressDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
    @Inject(forwardRef(() => AnalyticsService))
    private analyticsService: AnalyticsService,
  ) {}

  /**
   * Get current reading progress for user and book
   */
  async getProgress(userId: string, bookId: string) {
    const progress = await this.readingProgressModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    if (!progress) {
      return {
        bookId,
        currentPage: 1,
        progressPercentage: 0,
        lastReadAt: null,
      };
    }

    return {
      bookId: progress.bookRef.toString(),
      currentPage: progress.currentPage,
      progressPercentage: progress.progressPercentage,
      lastReadAt: progress.lastReadAt,
    };
  }

  /**
   * Create or update reading progress
   */
  async updateProgress(userId: string, bookId: string, dto: CreateReadingProgressDto) {
    // Verify book exists and get total pages
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // For now, assume total pages is stored in book metadata
    // You'll need to adjust this based on your book schema
    const totalPages = (book as any).totalPages || 300; // Default fallback

    if (dto.currentPage > totalPages) {
      throw new BadRequestException(`Current page cannot exceed total pages (${totalPages})`);
    }

    // Get previous progress to calculate pages read in this session
    const previousProgress = await this.readingProgressModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    const previousPage = previousProgress?.currentPage || 1;
    const progressPercentage = Math.round((dto.currentPage / totalPages) * 100);

    const progress = await this.readingProgressModel.findOneAndUpdate(
      {
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
      },
      {
        currentPage: dto.currentPage,
        progressPercentage,
        lastReadAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Record a reading session if pages were read (and service is available)
    if (this.analyticsService && dto.currentPage > previousPage) {
      const pagesRead = dto.currentPage - previousPage;
      // Estimate duration: ~2 minutes per page (can be customized)
      const estimatedDuration = Math.max(1, Math.round(pagesRead * 2));

      try {
        await this.analyticsService.recordSession(
          userId,
          bookId,
          previousPage,
          dto.currentPage,
          estimatedDuration,
        );
      } catch (error) {
        // Log error but don't fail the progress update
        console.error('Failed to record reading session:', error);
      }
    }

    return {
      bookId: progress.bookRef.toString(),
      currentPage: progress.currentPage,
      progressPercentage: progress.progressPercentage,
      lastReadAt: progress.lastReadAt,
    };
  }

  /**
   * Get all reading progress for a user
   */
  async getUserProgress(userId: string) {
    const progressList = await this.readingProgressModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', 'title coverUrl')
      .sort({ lastReadAt: -1 });

    return progressList.map((p) => ({
      bookId: p.bookRef._id,
      bookTitle: (p.bookRef as any).title,
      bookCoverUrl: (p.bookRef as any).coverUrl,
      currentPage: p.currentPage,
      progressPercentage: p.progressPercentage,
      lastReadAt: p.lastReadAt,
    }));
  }

  /**
   * Delete reading progress (when user removes a book)
   */
  async deleteProgress(userId: string, bookId: string) {
    const result = await this.readingProgressModel.findOneAndDelete({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    if (!result) {
      throw new NotFoundException('Reading progress not found');
    }

    return { message: 'Reading progress deleted' };
  }
}
