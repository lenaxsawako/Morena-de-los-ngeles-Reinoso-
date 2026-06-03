import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCategoriesController {
  constructor(private adminSettingsService: AdminSettingsService) {}

  /**
   * GET /admin/categories
   * Get all categories sorted by order
   */
  @Get()
  async getCategories() {
    const categories = await this.adminSettingsService.getCategories();
    return { items: categories };
  }

  /**
   * POST /admin/categories
   * Create new category
   */
  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminSettingsService.createCategory(dto);
  }

  /**
   * GET /admin/categories/:id
   * Get category by ID
   */
  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.adminSettingsService.getCategoryById(id);
  }

  /**
   * PUT /admin/categories/:id
   * Update category
   */
  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminSettingsService.updateCategory(id, dto);
  }

  /**
   * DELETE /admin/categories/:id
   * Delete category
   */
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.adminSettingsService.deleteCategory(id);
  }
}
