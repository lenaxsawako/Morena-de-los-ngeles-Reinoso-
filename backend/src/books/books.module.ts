import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { BOOK_MODEL, CHAPTER_MODEL, BookSchema, ChapterSchema } from '../models';
// import { BooksService } from './books.service';

@Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: BOOK_MODEL, schema: BookSchema },
//       { name: CHAPTER_MODEL, schema: ChapterSchema },
//     ]),
//   ],
//   providers: [BooksService],
//   exports: [BooksService],
})
export class BooksModule {}
