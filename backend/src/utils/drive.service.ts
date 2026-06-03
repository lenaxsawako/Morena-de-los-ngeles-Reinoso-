import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';

@Injectable()
export class DriveService implements OnModuleInit {
  private readonly logger = new Logger(DriveService.name);
  private driveClient: any;
  private isEnabled = false;

  constructor(
    @InjectModel(SiteConfig.name)
    private siteConfigModel: Model<SiteConfigDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Load Google Drive config from database on startup
    await this.loadGoogleDriveConfig();
  }

  /**
   * Load Google Drive credentials from MongoDB
   */
  private async loadGoogleDriveConfig() {
    try {
      const config = await this.siteConfigModel
        .findOne()
        .select('+googleDrive')
        .lean();

      if (!config?.googleDrive?.enabled) {
        this.isEnabled = false;
        this.driveClient = null;
        this.logger.warn('DriveService: Google Drive not enabled in SiteConfig');
        return;
      }

      const { serviceAccountJson } = config.googleDrive;

      if (!serviceAccountJson || Object.keys(serviceAccountJson).length === 0) {
        this.isEnabled = false;
        this.driveClient = null;
        this.logger.warn('DriveService: Service account JSON not configured in SiteConfig');
        return;
      }

      try {
        // Create auth using service account
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccountJson,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });

        // Create Drive client
        this.driveClient = google.drive({
          version: 'v3',
          auth,
        });

        this.isEnabled = true;
        this.logger.log('DriveService: Google Drive credentials loaded from database');
      } catch (authError) {
        this.logger.error(`DriveService: Invalid service account JSON: ${(authError as any).message}`);
        this.isEnabled = false;
        this.driveClient = null;
      }
    } catch (error) {
      this.logger.error(`Failed to load Google Drive config: ${(error as any).message}`);
      this.isEnabled = false;
      this.driveClient = null;
    }
  }

  /**
   * Listen for Google Drive config updates from admin settings
   */
  @OnEvent('settings.googleDrive.updated')
  async handleGoogleDriveUpdate() {
    this.logger.log('DriveService: Reloading Google Drive credentials due to settings update');
    await this.loadGoogleDriveConfig();
  }

  isConfigured(): boolean {
    return this.isEnabled && !!this.driveClient;
  }

  async getDriveClient() {
    if (!this.isEnabled || !this.driveClient) {
      this.logger.warn('DriveService: Google Drive not configured or disabled');
      return null;
    }
    return this.driveClient;
  }

  async getCoversFolderId(): Promise<string | undefined> {
    const config = await this.siteConfigModel
      .findOne()
      .select('+googleDrive')
      .lean();
    const folderId = config?.googleDrive?.coversFolderId?.trim();
    return folderId || undefined;
  }

  async getFileStream(fileId: string): Promise<Readable> {
    const drive = await this.getDriveClient();
    if (!drive) throw new Error('DriveService not configured — missing credentials');
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );
    return res.data as Readable;
  }

  async downloadFileAsBuffer(fileId: string): Promise<Buffer> {
    const stream = await this.getFileStream(fileId);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  // Placeholder for signed URLs or token expiry
  async generateSignedUrl(fileId: string): Promise<string> {
    // Implement based on strategy (proxy download, signed URL via GCS, etc.)
    throw new Error('Not implemented: generateSignedUrl');
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    parentFolderId?: string,
  ): Promise<{ fileId: string }> {
    const drive = await this.getDriveClient();
    if (!drive) {
      throw new Error('DriveService not configured — missing credentials');
    }

    const fileMetadata: { name: string; mimeType: string; parents?: string[] } = {
      name: fileName,
      mimeType,
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const media = {
      mimeType,
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id',
    });

    return { fileId: response.data.id };
  }

  /**
   * Get public shareable URL for a file
   */
  async getPublicUrl(fileId: string): Promise<string> {
    const drive = await this.getDriveClient();
    if (!drive) {
      throw new Error('DriveService not configured — missing credentials');
    }

    // Share the file publicly
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (error) {
      this.logger.warn(`Could not make file ${fileId} public: ${(error as any).message}`);
    }

    // Return public URL
    return `https://drive.google.com/uc?id=${fileId}`;
  }
}
