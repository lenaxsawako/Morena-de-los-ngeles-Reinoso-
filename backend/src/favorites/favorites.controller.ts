import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async getUserFavorites(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.favoritesService.getUserFavorites(userId);
  }

  @Get('ids')
  async getFavoriteIds(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const ids = await this.favoritesService.getFavoriteBookIds(userId);
    return { ids };
  }

  @Get('check/:bookId')
  async checkFavorite(@Req() req: Request, @Param('bookId') bookId: string) {
    const userId = (req as any).user?.sub;
    const isFav = await this.favoritesService.isFavorite(userId, bookId);
    return { isFavorite: isFav };
  }

  @Post(':bookId')
  async addFavorite(@Req() req: Request, @Param('bookId') bookId: string) {
    const userId = (req as any).user?.sub;
    return this.favoritesService.addFavorite(userId, bookId);
  }

  @Delete(':bookId')
  async removeFavorite(@Req() req: Request, @Param('bookId') bookId: string) {
    const userId = (req as any).user?.sub;
    return this.favoritesService.removeFavorite(userId, bookId);
  }
}
