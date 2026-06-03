import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { PolarService } from '../utils/polar.service';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private polarService: PolarService,
  ) {}

  async createCheckout(bookId: string, userId: string): Promise<{ url: string }> {
    const book = await this.bookModel.findById(bookId).lean().exec();
    if (!book) {
      throw new BadRequestException('Book not found');
    }
    if (!book.polarProductId) {
      throw new BadRequestException('This book is not configured for Polar payments');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
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
