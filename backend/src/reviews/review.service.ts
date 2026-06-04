import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from '../models/review.schema';
import { Book, BookDocument } from '../models/book.schema';
import { Purchase, PurchaseDocument, PurchaseStatus } from '../models/purchase.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
  ) {}

  async upsert(userId: string, dto: CreateReviewDto) {
    const bookId = dto.bookId;
    const book = await this.bookModel.findById(bookId).where('isPublished').equals(true).lean();
    if (!book) throw new NotFoundException('Book not found');

    const purchase = await this.purchaseModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
      status: PurchaseStatus.PAID,
    }).lean();
    if (!purchase) throw new ForbiddenException('Debes comprar el libro para valorarlo');

    const now = new Date();
    const review = await this.reviewModel.findOneAndUpdate(
      {
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
      },
      {
        $set: {
          rating: dto.rating,
          comment: dto.comment || null,
          status: ReviewStatus.APPROVED,
          updatedAt: now,
        },
        $setOnInsert: {
          userRef: new Types.ObjectId(userId),
          bookRef: new Types.ObjectId(bookId),
          createdAt: now,
        },
      },
      { upsert: true, new: true },
    );

    return { id: review._id, status: review.status };
  }

  async getBookReviews(bookId: string) {
    const reviews = await this.reviewModel
      .find({ bookRef: new Types.ObjectId(bookId), status: ReviewStatus.APPROVED })
      .populate('userRef', 'profile.username')
      .sort({ createdAt: -1 })
      .lean();

    return reviews.map((r: any) => ({
      id: r._id,
      userName: r.userRef?.profile?.username || 'Lector',
      rating: r.rating,
      comment: r.comment || undefined,
      createdAt: r.createdAt,
    }));
  }

  async getBookRating(bookId: string) {
    const [avg] = await this.reviewModel.aggregate([
      { $match: { bookRef: new Types.ObjectId(bookId), status: ReviewStatus.APPROVED } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    return {
      avgRating: avg ? parseFloat(avg.avgRating.toFixed(1)) : 0,
      count: avg?.count || 0,
    };
  }
}