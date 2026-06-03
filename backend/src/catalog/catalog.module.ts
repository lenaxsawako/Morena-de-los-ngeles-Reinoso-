import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { Category, CategorySchema } from '../models/category.schema';
import { SharedModule } from '../shared/shared.module';
import { CatalogService } from './catalog.service';
import { CatalogController, BooksController } from './catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    SharedModule,
  ],
  controllers: [CatalogController, BooksController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
