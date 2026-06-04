import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Purchase, PurchaseDocument } from '../models/purchase.schema';
import { PolarService } from '../utils/polar.service';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    private polarService: PolarService,
  ) {}

  async createCheckout(bookId: string, userId: string, origin?: string): Promise<{ url: string }> {
    const book = await this.bookModel.findById(bookId).lean().exec();
    if (!book) {
      throw new BadRequestException('Book not found');
    }
    if (!book.polarProductId) {
      throw new BadRequestException('This book is not configured for Polar payments');
    }

    const existing = await this.purchaseModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    }).exec();

    if (existing) {
      throw new BadRequestException('Ya has comprado este libro');
    }

    const isLocalOrigin = origin?.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1');
    const baseUrl = origin && !isLocalOrigin
      ? `${origin}/book`
      : process.env.FRONTEND_URL || 'http://localhost:5174';
    const checkout = await this.polarService.createCheckout({
      products: [book.polarProductId],
      successUrl: `${baseUrl}/checkout/${bookId}/confirm?checkout_id={CHECKOUT_ID}`,
      metadata: {
        userId,
        bookId,
      },
    });

    return { url: checkout.url };
  }
}
