import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../shared/shared.module';
import { Review, ReviewSchema } from '../models/review.schema';
import { Book, BookSchema } from '../models/book.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Book.name, schema: BookSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}