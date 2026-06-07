import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../models/book.schema';
import { SeoController } from './seo.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [SeoController],
})
export class SeoModule {}
