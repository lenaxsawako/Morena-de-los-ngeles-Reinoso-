import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { CloudinaryService } from '../utils/cloudinary.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSettingsController {
  constructor(
    private adminSettingsService: AdminSettingsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * GET /admin/settings
   * Get all platform settings
   */
  @Get()
  async getSettings() {
    return this.adminSettingsService.getSettings();
  }

  /**
   * PUT /admin/settings
   * Update platform settings
   */
  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.adminSettingsService.updateSettings(dto);
  }

  /**
   * POST /admin/settings/test-polar
   * Test Polar payment provider connectivity
   */
  @Post('test-polar')
  async testPolar() {
    return this.adminSettingsService.testPolar();
  }

  /**
   * POST /admin/settings/test-drive
   * Test Google Drive connectivity
   */
  @Post('test-drive')
  async testGoogleDrive() {
    return this.adminSettingsService.testGoogleDrive();
  }

  /**
   * POST /admin/settings/test-cloudinary
   * Test Cloudinary connectivity (uploads a 1px test image)
   */
  @Post('test-cloudinary')
  async testCloudinary() {
    if (!this.cloudinaryService.isConfigured()) {
      throw new BadRequestException(
        'Cloudinary no está configurado. Guarda cloud name, API key y API secret.',
      );
    }
    return this.cloudinaryService.testConnection();
  }

  /**
   * GET /admin/settings/list-drive-folders
   * List all folders in Google Drive
   */
  @Get('list-drive-folders')
  async listDriveFolders() {
    return this.adminSettingsService.listDriveFolders();
  }

  /**
   * GET /admin/settings/list-drive-files
   * List PDF files in the configured books folder or a specific folder.
   */
  @Get('list-drive-files')
  async listDriveFiles(@Query('folderId') folderId?: string) {
    return this.adminSettingsService.listDriveFiles(folderId);
  }

  /**
   * POST /admin/settings/test-email
   * Test SMTP configuration and send test email
   */
  @Post('test-email')
  async testEmail() {
    return this.adminSettingsService.testEmail();
  }
}
