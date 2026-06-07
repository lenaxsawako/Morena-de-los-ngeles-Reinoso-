import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteConfigDocument = SiteConfig & Document;

@Schema({ timestamps: true })
export class SiteConfig {
  // Website settings
  @Prop({ default: 'Literary Book Broker' })
  siteName!: string;

  @Prop({ default: 'contact@example.com' })
  contactEmail!: string;

  @Prop({ default: 'A curated collection of literary works' })
  description!: string;

  @Prop({ default: null })
  logoUrl?: string;

  @Prop({
    type: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    default: {},
  })
  socialLinks!: {
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };

  @Prop({
    type: {
      title: { type: String, default: 'Literary Book Broker' },
      description: { type: String, default: 'Discover amazing books' },
    },
    default: {},
  })
  seo!: {
    title: string;
    description: string;
  };

  // Notification settings
  @Prop({
    type: {
      newPurchase: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: false },
      weeklySummary: { type: Boolean, default: true },
      monthlySummary: { type: Boolean, default: true },
    },
    default: {},
  })
  notifications!: {
    newPurchase: boolean;
    newReview: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    monthlySummary: boolean;
  };

  // Polar payment configuration
  @Prop({
    type: {
      provider: { type: String, default: 'polar' },
      enabled: { type: Boolean, default: false },
      server: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      apiKey: { type: String, default: '' },
      webhookSecret: { type: String, default: '' },
      connected: { type: Boolean, default: false },
    },
    default: {},
  })
  polar!: {
    provider: string;
    enabled: boolean;
    server: 'sandbox' | 'production';
    apiKey: string;
    webhookSecret: string;
    connected: boolean;
  };

  // Google Drive configuration (Service Account)
  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      serviceAccountJson: { type: Object, default: {} },
      booksFolderId: { type: String, default: '' },
      coversFolderId: { type: String, default: '' },
    },
    default: {},
    select: false, // Exclude from queries by default
  })
  googleDrive!: {
    enabled: boolean;
    serviceAccountJson: Record<string, any>;
    booksFolderId: string;
    coversFolderId: string;
  };

  // Cloudinary (book covers)
  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      cloudName: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      apiSecret: { type: String, default: '' },
      folder: { type: String, default: 'lbb/covers' },
    },
    default: {},
    select: false,
  })
  cloudinary!: {
    enabled: boolean;
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  };

  // SMTP configuration (password never returned in GET)
  @Prop({
    type: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      user: { type: String, default: '' },
      password: { type: String, default: '' },
      senderEmail: { type: String, default: '' },
    },
    default: {},
    select: false, // Exclude from queries by default
  })
  smtp!: {
    host: string;
    port: number;
    user: string;
    password: string;
    senderEmail: string;
  };

  // System settings
  @Prop({
    type: {
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: { type: String, default: 'Site under maintenance' },
    },
    default: {},
  })
  system!: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };

  // Coming Soon / Launch Mode
  @Prop({ default: true })
  launchMode!: boolean;

  @Prop({ default: null })
  launchDate?: Date | null;

  @Prop({ default: 'Próximamente' })
  comingSoonTitle!: string;

  @Prop({ default: '' })
  comingSoonSubtitle!: string;

  @Prop({ default: '' })
  comingSoonBg!: string;

  // Landing page content
  @Prop({
    type: {
      philosophy: {
        title: { type: String, default: '' },
        content: { type: String, default: '' },
      },
      authorImageUrl: { type: String, default: null },
    },
    default: {},
  })
  landing!: {
    philosophy: {
      title: string;
      content: string;
    };
    authorImageUrl?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const SiteConfigSchema = SchemaFactory.createForClass(SiteConfig);
