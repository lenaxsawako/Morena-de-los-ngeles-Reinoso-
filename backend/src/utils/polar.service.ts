import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Polar } from '@polar-sh/sdk';
import { SiteConfig, SiteConfigDocument } from '../models/site-config.schema';

@Injectable()
export class PolarService implements OnModuleInit {
  private readonly logger = new Logger(PolarService.name);
  private client: Polar | null = null;
  private isEnabled = false;

  constructor(
    @InjectModel(SiteConfig.name) private siteConfigModel: Model<SiteConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.loadConfigFromDatabase();
  }

  private async loadConfigFromDatabase() {
    try {
      const config = await this.siteConfigModel.findOne().select('+polar').lean().exec();
      if (config?.polar) {
        this.logger.debug(`[POLAR DEBUG] loaded from DB — enabled: ${config.polar.enabled}, key length: ${config.polar.apiKey?.length || 0}, first chars: ${config.polar.apiKey ? config.polar.apiKey.substring(0, 4) + '...' : 'N/A'}`);
        this.configure(config.polar);
      } else {
        this.logger.debug('[POLAR DEBUG] no polar config found in DB');
      }
    } catch (err) {
      this.logger.error(`Error loading Polar config: ${err.message}`);
    }
  }

  public configure(config: { enabled: boolean; server: 'sandbox' | 'production'; apiKey: string }): void {
    this.isEnabled = config.enabled;

    if (config.enabled && config.apiKey) {
      const server = config.server || 'sandbox';
      const baseUrl = server === 'production' ? 'https://api.polar.sh' : 'https://sandbox-api.polar.sh';
      this.logger.debug(`[POLAR DEBUG] configuring SDK — key len: ${config.apiKey.length}, first 4: ${config.apiKey.substring(0, 4)}..., server: ${server}, baseUrl: ${baseUrl}`);
      this.client = new Polar({ accessToken: config.apiKey, server });
      this.logger.log(`Polar SDK configured (${server})`);
    } else {
      this.logger.debug(`[POLAR DEBUG] configuring SDK — enabled: ${config.enabled}, key present: ${!!config.apiKey}`);
      this.client = null;
      this.logger.log('Polar disabled');
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Polar not configured' };
    }

    try {
      await this.client.customers.list({ limit: 1 });
      return { success: true, message: 'Polar connection successful' };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Polar connection failed',
      };
    }
  }

  async createCheckout(params: {
    products: string[];
    successUrl: string;
    metadata: Record<string, string>;
    discountId?: string;
  }): Promise<{ id: string; url: string }> {
    if (!this.client) {
      throw new Error('Polar not configured');
    }

    const result = await this.client.checkouts.create({
      products: params.products,
      successUrl: params.successUrl,
      metadata: params.metadata as any,
      discountId: params.discountId,
    });

    return { id: result.id, url: result.url };
  }

  async getCheckout(checkoutId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Polar not configured');
    }
    return this.client.checkouts.get({ id: checkoutId });
  }

  async createProduct(params: {
    name: string;
    description: string;
    priceAmount: number;
    currency: string;
  }): Promise<{ id: string }> {
    if (!this.client) {
      throw new Error('Polar not configured');
    }

    this.logger.debug(`[POLAR DEBUG] createProduct — client configured: true`);
    const result = await this.client.products.create({
      name: params.name,
      description: params.description || null,
      prices: [
        {
          amountType: 'fixed' as const,
          priceCurrency: params.currency as any,
          priceAmount: params.priceAmount,
        },
      ],
      visibility: 'private',
    });

    return { id: result.id };
  }

  async updateProduct(params: {
    id: string;
    name?: string;
    description?: string;
    priceAmount?: number;
    currency?: string;
  }): Promise<void> {
    if (!this.client) {
      throw new Error('Polar not configured');
    }

    const update: any = {};
    if (params.name !== undefined) update.name = params.name;
    if (params.description !== undefined) update.description = params.description;
    if (params.priceAmount !== undefined && params.currency !== undefined) {
      update.prices = [
        {
          amountType: 'fixed' as const,
          priceCurrency: params.currency as any,
          priceAmount: params.priceAmount,
        },
      ];
    }

    await this.client.products.update({ id: params.id, productUpdate: update });
  }

  getStatus(): { enabled: boolean; configured: boolean } {
    return { enabled: this.isEnabled, configured: !!this.client };
  }

  async createDiscount(dto: {
    name: string;
    code: string;
    type: 'percentage' | 'fixed';
    amount: number;
    duration?: 'once' | 'forever' | 'repeating';
    endsAt?: string;
    maxRedemptions?: number;
  }): Promise<{ id: string; code: string }> {
    if (!this.client) throw new Error('Polar not configured');

    const payload: any = {
      name: dto.name,
      code: dto.code,
      duration: dto.duration || 'once',
      ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
      ...(dto.maxRedemptions != null ? { maxRedemptions: dto.maxRedemptions } : {}),
    };

    if (dto.type === 'percentage') {
      payload.type = 'percentage';
      payload.basisPoints = dto.amount * 100;
    } else {
      payload.type = 'fixed';
      payload.amount = dto.amount;
    }

    const result = await this.client.discounts.create(payload);
    return { id: result.id, code: result.code! };
  }

  async listDiscounts(): Promise<any[]> {
    if (!this.client) throw new Error('Polar not configured');
    const page = await this.client.discounts.list({ limit: 100 });
    return page.result?.items || [];
  }

  async deleteDiscount(id: string): Promise<void> {
    if (!this.client) throw new Error('Polar not configured');
    await this.client.discounts.delete({ id });
  }

  @OnEvent('settings.polar.updated')
  handlePolarUpdate(payload: { enabled: boolean; server: 'sandbox' | 'production'; apiKey: string }) {
    this.logger.log('Polar configuration updated via event');
    this.configure(payload);
  }
}
