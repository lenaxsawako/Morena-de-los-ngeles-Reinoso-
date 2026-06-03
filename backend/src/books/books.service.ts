import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
// import { BookDocument, ChapterDocument } from '../models';
// import { BOOK_MODEL, CHAPTER_MODEL } from '../models';

@Injectable()
export class BooksService {
  constructor(
    // @InjectModel(BOOK_MODEL) private bookModel: Model<BookDocument>,
    // @InjectModel(CHAPTER_MODEL) private chapterModel: Model<ChapterDocument>,
  ) {}

//   async findBookBySlug(slug: string) {
//     return this.bookModel.findOne({ slug }).lean();
//   }

//   async listChapters(bookId: string) {
//     return this.chapterModel.find({ bookRef: new Types.ObjectId(bookId) }).sort({ order: 1 }).lean();
//   }
}
