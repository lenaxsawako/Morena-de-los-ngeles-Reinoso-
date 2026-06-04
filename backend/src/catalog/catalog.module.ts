import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { Category, CategorySchema } from '../models/category.schema';
import { Purchase, PurchaseSchema } from '../models/purchase.schema';
import { Review, ReviewSchema } from '../models/review.schema';
import { SharedModule } from '../shared/shared.module';
import { CatalogService } from './catalog.service';
import { CatalogController, BooksController } from './catalog.controller';
import { PurchaseAccessGuard } from '../guards/purchase-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    SharedModule,
  ],
  controllers: [CatalogController, BooksController],
  providers: [CatalogService, PurchaseAccessGuard],
  exports: [CatalogService],
})
export class CatalogModule {}
