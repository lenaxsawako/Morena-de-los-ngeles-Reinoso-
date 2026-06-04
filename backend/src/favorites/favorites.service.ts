import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from '../models/favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
  ) {}

  async addFavorite(userId: string, bookId: string) {
    const existing = await this.favoriteModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    }).lean();

    if (existing) {
      throw new ConflictException('Book already in favorites');
    }

    const fav = new this.favoriteModel({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    return fav.save();
  }

  async removeFavorite(userId: string, bookId: string) {
    const result = await this.favoriteModel.deleteOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Favorite not found');
    }

    return { message: 'Favorite removed' };
  }

  async getUserFavorites(userId: string) {
    const favorites = await this.favoriteModel
      .find({ userRef: new Types.ObjectId(userId) })
      .populate('bookRef', '_id title subtitle description coverUrl priceCents currency')
      .sort({ createdAt: -1 })
      .lean();

    return favorites.map((f) => ({
      _id: f._id,
      book: f.bookRef,
      createdAt: f.createdAt,
    }));
  }

  async getFavoriteBookIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel
      .find({ userRef: new Types.ObjectId(userId) })
      .select('bookRef')
      .lean();
    return favorites.map((f) => f.bookRef.toString());
  }

  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    const fav = await this.favoriteModel.findOne({
      userRef: new Types.ObjectId(userId),
      bookRef: new Types.ObjectId(bookId),
    }).lean();
    return !!fav;
  }
}
