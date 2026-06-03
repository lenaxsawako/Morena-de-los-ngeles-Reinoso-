import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from '../models/bookmark.schema';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(
    @InjectModel(Bookmark.name)
    private bookmarkModel: Model<BookmarkDocument>,
  ) {}

  /**
   * Get all bookmarks for a user in a book
   */
  async getBookmarks(userId: string, bookId: string) {
    const bookmarks = await this.bookmarkModel
      .find({
        userRef: new Types.ObjectId(userId),
        bookRef: new Types.ObjectId(bookId),
      })
      .sort({ page: 1 });

    return bookmarks.map((b) => ({
      id: b._id,
      page: b.page,
      note: b.note,
      createdAt: (b as any).createdAt,
      updatedAt: (b as any).updatedAt,
    }));
  }

  /**
   * Create a bookmark
   */
  async createBookmark(userId: string, bookId: string, dto: CreateBookmarkDto) {
    const bookmark = await this.bookmarkModel.create({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
      page: dto.page,
      note: dto.note || '',
    });

    return {
      id: bookmark._id,
      page: bookmark.page,
      note: bookmark.note,
      createdAt: (bookmark as any).createdAt,
    };
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(userId: string, bookmarkId: string) {
    const bookmark = await this.bookmarkModel.findOneAndDelete({
      _id: new Types.ObjectId(bookmarkId),
      userRef: new Types.ObjectId(userId),
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return { message: 'Bookmark deleted' };
  }

  /**
   * Update a bookmark
   */
  async updateBookmark(userId: string, bookmarkId: string, dto: CreateBookmarkDto) {
    const bookmark = await this.bookmarkModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(bookmarkId),
        userRef: new Types.ObjectId(userId),
      },
      {
        page: dto.page,
        note: dto.note || '',
      },
      { new: true },
    );

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return {
      id: bookmark._id,
      page: bookmark.page,
      note: bookmark.note,
      updatedAt: (bookmark as any).updatedAt,
    };
  }

  /**
   * Get all bookmarks for a user across all books
   */
  async getAllUserBookmarks(userId: string) {
    const bookmarks = await this.bookmarkModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', 'title coverUrl')
      .sort({ createdAt: -1 });

    return bookmarks.map((b) => ({
      id: b._id,
      bookId: b.bookRef._id,
      bookTitle: (b.bookRef as any).title,
      bookCoverUrl: (b.bookRef as any).coverUrl,
      page: b.page,
      note: b.note,
      createdAt: (b as any).createdAt,
    }));
  }
}
