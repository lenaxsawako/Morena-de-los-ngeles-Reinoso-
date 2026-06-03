import { createHash } from 'crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';

interface CloudinaryRuntimeConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private config: CloudinaryRuntimeConfig | null = null;

  constructor(
    @InjectModel(SiteConfig.name)
    private siteConfigModel: Model<SiteConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  @OnEvent('settings.cloudinary.updated')
  async handleConfigUpdate() {
    this.logger.log('CloudinaryService: reloading configuration');
    await this.loadConfig();
  }

  isConfigured(): boolean {
    return !!this.config;
  }

  isEnabled(): boolean {
    return !!this.config;
  }

  private async loadConfig() {
    try {
      const siteConfig = await this.siteConfigModel
        .findOne()
        .select('+cloudinary')
        .lean();

      const cloudinary = siteConfig?.cloudinary;
      if (
        cloudinary?.enabled &&
        cloudinary.cloudName?.trim() &&
        cloudinary.apiKey?.trim() &&
        cloudinary.apiSecret?.trim()
      ) {
        this.config = {
          cloudName: cloudinary.cloudName.trim(),
          apiKey: cloudinary.apiKey.trim(),
          apiSecret: cloudinary.apiSecret.trim(),
          folder: cloudinary.folder?.trim() || 'lbb/covers',
        };
        this.logger.log('CloudinaryService: configuration loaded');
        return;
      }

      this.config = null;
      this.logger.warn('CloudinaryService: not configured or disabled');
    } catch (error) {
      this.config = null;
      this.logger.error(`CloudinaryService: failed to load config: ${(error as Error).message}`);
    }
  }

  private signParams(params: Record<string, string | number>, apiSecret: string): string {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1').update(payload + apiSecret).digest('hex');
  }

  async uploadImage(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    if (!this.config) {
      throw new Error(
        'Cloudinary no está configurado. Actívalo en Ajustes → Almacenamiento.',
      );
    }

    const { cloudName, apiKey, apiSecret, folder } = this.config;
    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = { timestamp };
    if (folder) {
      params.folder = folder;
    }

    const signature = this.signParams(params, apiSecret);
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }

    return data.secure_url;
  }

  /** Validates credentials with a minimal upload */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pngBase64, 'base64');
    const url = await this.uploadImage(buffer, 'connection-test.png', 'image/png');
    return {
      success: true,
      message: `Conexión correcta. URL de prueba: ${url}`,
    };
  }
}
