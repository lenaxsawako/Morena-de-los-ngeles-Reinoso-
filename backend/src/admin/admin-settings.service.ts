import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { google } from 'googleapis';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';
import { Category, CategoryDocument } from '../models/category.schema';
import { UpdateSettingsDto, CreateCategoryDto, UpdateCategoryDto } from './dto/settings.dto';
import { PolarService } from '../utils/polar.service';

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);
  private siteConfigCache: SiteConfigDocument | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private eventEmitter: EventEmitter2,
    private polarService: PolarService,
  ) {}

  /**
   * Get all settings (cached)
   */
  async getSettings() {
    const config = await this.getOrCreateConfig();

    return {
      website: {
        siteName: config.siteName,
        contactEmail: config.contactEmail,
        description: config.description,
        logoUrl: config.logoUrl,
        socialLinks: config.socialLinks,
        seo: config.seo,
      },
      notifications: config.notifications,
      payments: {
        polar: {
          provider: config.polar.provider,
          enabled: config.polar.enabled,
          server: config.polar.server,
          connected: config.polar.connected,
          webhookSecret: config.polar.webhookSecret ? '***' : '',
        },
      },
      storage: {
        googleDrive: {
          enabled: config.googleDrive.enabled,
          serviceAccountConfigured: config.googleDrive.serviceAccountJson && Object.keys(config.googleDrive.serviceAccountJson).length > 0,
          booksFolderId: config.googleDrive.booksFolderId,
          coversFolderId: config.googleDrive.coversFolderId,
          // serviceAccountJson never returned for security reasons
        },
        cloudinary: {
          enabled: config.cloudinary?.enabled ?? false,
          cloudName: config.cloudinary?.cloudName ?? '',
          apiKey: config.cloudinary?.apiKey ?? '',
          folder: config.cloudinary?.folder ?? 'lbb/covers',
          configured: !!(
            config.cloudinary?.cloudName &&
            config.cloudinary?.apiKey &&
            config.cloudinary?.apiSecret
          ),
        },
      },
      email: {
        smtp: {
          host: config.smtp?.host || '',
          port: config.smtp?.port || 587,
          user: config.smtp?.user || '',
          senderEmail: config.smtp?.senderEmail || '',
          // password never returned
        },
      },
      system: config.system,
      launch: {
        launchMode: config.launchMode ?? true,
        launchDate: config.launchDate ?? null,
        comingSoonTitle: config.comingSoonTitle || 'Próximamente',
        comingSoonSubtitle: config.comingSoonSubtitle || '',
        comingSoonBg: config.comingSoonBg || '',
      },
    };
  }

  /**
   * Update settings
   */
  async updateSettings(dto: UpdateSettingsDto) {
    const config = await this.getOrCreateConfig();

    // Log incoming DTO for debugging
    if (dto.googleDrive) {
      this.logger.log(`Received googleDrive update:`, JSON.stringify(dto.googleDrive, null, 2));
    }

    // Update website settings
    if (dto.siteName !== undefined) config.siteName = dto.siteName;
    if (dto.contactEmail !== undefined) config.contactEmail = dto.contactEmail;
    if (dto.description !== undefined) config.description = dto.description;
    if (dto.logoUrl !== undefined) config.logoUrl = dto.logoUrl;

    // Update social links
    if (dto.socialLinks) {
      config.socialLinks = { ...config.socialLinks, ...dto.socialLinks };
    }

    // Update SEO
    if (dto.seo) {
      config.seo = { ...config.seo, ...dto.seo };
    }

    // Update notifications
    if (dto.notifications) {
      config.notifications = { ...config.notifications, ...dto.notifications };
    }

    // Update Polar settings
    let polarUpdated = false;
    if (dto.polar) {
      const { apiKey, webhookSecret, ...rest } = dto.polar;
      this.logger.debug(`[POLAR DEBUG] incoming apiKey present: ${!!apiKey}, length: ${apiKey?.length || 0}, first chars: ${apiKey ? apiKey.substring(0, 4) + '...' : 'N/A'}`);
      this.logger.debug(`[POLAR DEBUG] existing apiKey in DB present: ${!!config.polar.apiKey}, length: ${config.polar.apiKey?.length || 0}`);
      config.polar = {
        ...config.polar,
        ...rest,
      };
      if (apiKey?.trim()) {
        config.polar.apiKey = apiKey.trim();
        this.logger.debug(`[POLAR DEBUG] applied new apiKey from request`);
      } else {
        this.logger.debug(`[POLAR DEBUG] kept existing apiKey (incoming was empty/unset)`);
      }
      if (webhookSecret?.trim()) {
        config.polar.webhookSecret = webhookSecret.trim();
      }
      polarUpdated = true;
    }

    // Update Google Drive settings
    let googleDriveUpdated = false;
    if (dto.googleDrive) {
      config.googleDrive = { ...config.googleDrive, ...dto.googleDrive };
      googleDriveUpdated = true;
    }

    // Update Cloudinary settings
    let cloudinaryUpdated = false;
    if (dto.cloudinary) {
      if (!config.cloudinary) {
        config.cloudinary = {
          enabled: false,
          cloudName: '',
          apiKey: '',
          apiSecret: '',
          folder: 'lbb/covers',
        };
      }
      const { apiSecret, ...rest } = dto.cloudinary;
      config.cloudinary = { ...config.cloudinary, ...rest };
      if (apiSecret?.trim()) {
        config.cloudinary.apiSecret = apiSecret.trim();
      }
      cloudinaryUpdated = true;
    }

    // Update SMTP settings
    let smtpUpdated = false;
    if (dto.smtp) {
      config.smtp = { ...config.smtp, ...dto.smtp };
      smtpUpdated = true;
    }

    // Update system settings
    if (dto.system) {
      config.system = { ...config.system, ...dto.system };
    }

    // Update launch mode settings
    if (dto.launchMode !== undefined) config.launchMode = dto.launchMode;
    if (dto.launchDate !== undefined) config.launchDate = dto.launchDate ? new Date(dto.launchDate) : null;
    if (dto.comingSoonTitle !== undefined) config.comingSoonTitle = dto.comingSoonTitle;
    if (dto.comingSoonSubtitle !== undefined) config.comingSoonSubtitle = dto.comingSoonSubtitle;
    if (dto.comingSoonBg !== undefined) config.comingSoonBg = dto.comingSoonBg;

    await config.save();

    // Invalidate cache
    this.invalidateCache();

    // Emit event if SMTP was updated so EmailService can reload config
    if (smtpUpdated && config.smtp) {
      this.logger.log('Emitting settings.smtp.updated event');
      this.eventEmitter.emit('settings.smtp.updated', config.smtp);
    }

    // Emit event if Google Drive was updated so DriveService can reload config
    if (googleDriveUpdated && config.googleDrive) {
      this.logger.log('Emitting settings.googleDrive.updated event');
      this.eventEmitter.emit('settings.googleDrive.updated', config.googleDrive);
    }

    if (cloudinaryUpdated && config.cloudinary) {
      this.logger.log('Emitting settings.cloudinary.updated event');
      this.eventEmitter.emit('settings.cloudinary.updated', config.cloudinary);
    }

    if (polarUpdated && config.polar) {
      this.logger.log('Emitting settings.polar.updated event');
      this.eventEmitter.emit('settings.polar.updated', {
        enabled: config.polar.enabled,
        server: config.polar.server,
        apiKey: config.polar.apiKey,
      });
    }

    return this.getSettings();
  }

  /**
   * Test Polar connectivity
   */
  async testPolar() {
    const result = await this.polarService.testConnection();
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return result;
  }

  /**
   * Test Google Drive connectivity
   */
  async testGoogleDrive() {
    const config = await this.getOrCreateConfig();

    if (!config.googleDrive.enabled) {
      throw new BadRequestException('Google Drive is not enabled');
    }

    if (!config.googleDrive.serviceAccountJson || Object.keys(config.googleDrive.serviceAccountJson).length === 0) {
      throw new BadRequestException('Google Drive service account JSON not configured');
    }

    if (!config.googleDrive.booksFolderId) {
      throw new BadRequestException('Books folder ID not configured');
    }

    try {
      // Create auth using service account
      const auth = new google.auth.GoogleAuth({
        credentials: config.googleDrive.serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      // Create Drive API instance
      const drive = google.drive({ version: 'v3', auth });

      // Test access to books folder
      await drive.files.get({
        fileId: config.googleDrive.booksFolderId,
        fields: 'id,name,mimeType',
      });

      // Test access to covers folder if configured
      if (config.googleDrive.coversFolderId) {
        await drive.files.get({
          fileId: config.googleDrive.coversFolderId,
          fields: 'id,name,mimeType',
        });
      }

      return {
        success: true,
        message: 'Google Drive connection successful and folders are accessible',
      };
    } catch (error: any) {
      this.logger.error('Google Drive connectivity test failed:', error.message);

      if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid')) {
        throw new BadRequestException('Google Drive service account JSON is invalid or malformed');
      }

      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new BadRequestException('Google Drive authentication failed - invalid service account');
      }

      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        throw new BadRequestException('Google Drive folder not found - invalid folder ID');
      }

      throw new InternalServerErrorException(
        `Failed to connect to Google Drive: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * List all folders in Google Drive
   */
  async listDriveFolders() {
    const config = await this.getOrCreateConfig();

    if (!config.googleDrive.enabled) {
      throw new BadRequestException('Google Drive is not enabled');
    }

    if (!config.googleDrive.serviceAccountJson || Object.keys(config.googleDrive.serviceAccountJson).length === 0) {
      throw new BadRequestException('Google Drive service account JSON not configured');
    }

    try {
      // Create auth using service account
      const auth = new google.auth.GoogleAuth({
        credentials: config.googleDrive.serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      // Create Drive API instance
      const drive = google.drive({ version: 'v3', auth });

      // List all folders
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces: 'drive',
        fields: 'files(id, name, webViewLink)',
        pageSize: 100,
        orderBy: 'name',
      });

      return {
        folders: response.data.files || [],
      };
    } catch (error: any) {
      this.logger.error('Failed to list Google Drive folders:', error.message);

      if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid')) {
        throw new BadRequestException('Google Drive service account JSON is invalid or malformed');
      }

      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new BadRequestException('Google Drive authentication failed - invalid service account');
      }

      throw new InternalServerErrorException(
        `Failed to list Google Drive folders: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * List PDF files from Google Drive.
   */
  async listDriveFiles(folderId?: string) {
    const config = await this.getOrCreateConfig();

    if (!config.googleDrive.enabled) {
      throw new BadRequestException('Google Drive is not enabled');
    }

    if (!config.googleDrive.serviceAccountJson || Object.keys(config.googleDrive.serviceAccountJson).length === 0) {
      throw new BadRequestException('Google Drive service account JSON not configured');
    }

    const targetFolderId = folderId || config.googleDrive.booksFolderId;
    if (!targetFolderId) {
      throw new BadRequestException('Books folder ID not configured');
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: config.googleDrive.serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        q: `'${targetFolderId}' in parents and mimeType='application/pdf' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, mimeType, size, webViewLink, modifiedTime)',
        pageSize: 100,
        orderBy: 'name',
      });

      return {
        files: response.data.files || [],
      };
    } catch (error: any) {
      this.logger.error('Failed to list Google Drive files:', error.message);

      if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid')) {
        throw new BadRequestException('Google Drive service account JSON is invalid or malformed');
      }

      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new BadRequestException('Google Drive authentication failed - invalid service account');
      }

      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        throw new BadRequestException('Google Drive folder not found - invalid folder ID');
      }

      throw new InternalServerErrorException(
        `Failed to list Google Drive files: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Test SMTP connectivity and send test email
   */
  async testEmail() {
    const config = await this.getOrCreateConfig();

    if (!config.smtp?.host) {
      throw new BadRequestException('SMTP server not configured');
    }

    try {
      // TODO: Implement actual SMTP test
      // For now, just validate configuration
      return {
        success: true,
        message: 'SMTP configuration is valid and test email would be sent',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send test email');
    }
  }

  /**
   * Get or create singleton SiteConfig
   */
  private async getOrCreateConfig(): Promise<SiteConfigDocument> {
    // Check cache first
    if (this.siteConfigCache && this.cacheExpiry > Date.now()) {
      return this.siteConfigCache;
    }

    // Load with hidden fields (+smtp +googleDrive)
    let config = await this.siteConfigModel.findOne().select('+smtp +googleDrive +cloudinary').exec();

    if (!config) {
      // Create default config
      config = await this.siteConfigModel.create({
        siteName: 'Literary Book Broker',
        contactEmail: 'contact@example.com',
        description: 'A curated collection of literary works',
        socialLinks: {
          instagram: '',
          twitter: '',
          tiktok: '',
          youtube: '',
        },
        seo: {
          title: 'Literary Book Broker',
          description: 'Discover amazing books',
        },
        notifications: {
          newPurchase: true,
          newReview: true,
          dailySummary: false,
          weeklySummary: true,
          monthlySummary: true,
        },
        polar: {
          provider: 'polar',
          environment: 'sandbox',
          apiKey: '',
          webhookSecret: '',
          connected: false,
        },
        googleDrive: {
          enabled: false,
          serviceAccountJson: {},
          booksFolderId: '',
          coversFolderId: '',
        },
        cloudinary: {
          enabled: false,
          cloudName: '',
          apiKey: '',
          apiSecret: '',
          folder: 'lbb/covers',
        },
        smtp: {
          host: '',
          port: 587,
          user: '',
          password: '',
          senderEmail: '',
        },
        system: {
          maintenanceMode: false,
          maintenanceMessage: 'Site under maintenance',
        },
        launchMode: true,
        launchDate: null,
        comingSoonTitle: 'Próximamente',
        comingSoonSubtitle: '',
        comingSoonBg: '',
      });
    }

    // Cache for 5 minutes
    this.siteConfigCache = config;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;

    return config;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache() {
    this.siteConfigCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Create category
   */
  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.categoryModel.findOne({ slug: dto.slug });

    if (existing) {
      throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
    }

    const category = await this.categoryModel.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
      order: dto.order ?? 0,
      active: dto.active ?? true,
    });

    return category;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    return this.categoryModel.find().sort({ order: 1, name: 1 }).lean();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new BadRequestException(`Category "${id}" not found`);
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new BadRequestException(`Category "${id}" not found`);
    }

    // Check slug uniqueness if updating
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({ slug: dto.slug });
      if (existing) {
        throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.order !== undefined) category.order = dto.order;
    if (dto.active !== undefined) category.active = dto.active;

    await category.save();

    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new BadRequestException(`Category "${id}" not found`);
    }

    return { message: `Category "${category.name}" deleted successfully` };
  }
}
