import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../models/book.schema';
import { Purchase, PurchaseDocument, PurchaseStatus } from '../models/purchase.schema';
import { RedisStoreService } from '../services/redis-store.service';

const CACHE_TTL = 3_600_000; // 1 hour
const PREFIX = 'access:';

@Injectable()
export class PurchaseAccessGuard implements CanActivate {
  private readonly logger = new Logger(PurchaseAccessGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    private redisStore: RedisStoreService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    // Extract bookId from route params (supports :bookId, :id)
    const bookId = request.params?.bookId || request.params?.id;
    if (!bookId) {
      this.logger.warn('PurchaseAccessGuard: no bookId in route params');
      return true;
    }

    // No authenticated user → check if book has free preview
    if (!userId) {
      const book = await this.bookModel.findById(bookId).select('previewPages').lean();
      if (!book) throw new ForbiddenException('Book not found');
      if ((book.previewPages || 0) > 0) return true;
      throw new ForbiddenException('Adquirí el libro para continuar');
    }

    // Check cache
    const cacheKey = `${PREFIX}${userId}:${bookId}`;
    const cached = await this.redisStore.get(cacheKey);
    if (cached === 'granted') return true;
    if (cached === 'denied') throw new ForbiddenException('Adquirí el libro para continuar');

    // Check book for free preview
    const book = await this.bookModel.findById(bookId).select('previewPages').lean();
    if (!book) throw new ForbiddenException('Book not found');
    if ((book.previewPages || 0) > 0) {
      await this.redisStore.set(cacheKey, 'granted', CACHE_TTL);
      return true;
    }

    // Check purchase
    const purchase = await this.purchaseModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
      status: { $in: [PurchaseStatus.PAID, PurchaseStatus.PENDING] },
    }).lean();

    if (purchase) {
      await this.redisStore.set(cacheKey, 'granted', CACHE_TTL);
      return true;
    }

    await this.redisStore.set(cacheKey, 'denied', CACHE_TTL);
    throw new ForbiddenException('Adquirí el libro para continuar');
  }
}
