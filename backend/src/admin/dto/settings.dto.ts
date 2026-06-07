import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, IsEnum } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };

  @IsOptional()
  seo?: {
    title?: string;
    description?: string;
  };

  @IsOptional()
  notifications?: {
    newPurchase?: boolean;
    newReview?: boolean;
    dailySummary?: boolean;
    weeklySummary?: boolean;
    monthlySummary?: boolean;
  };

  @IsOptional()
  polar?: {
    enabled?: boolean;
    server?: 'sandbox' | 'production';
    apiKey?: string;
    webhookSecret?: string;
  };

  @IsOptional()
  googleDrive?: {
    enabled?: boolean;
    serviceAccountJson?: Record<string, any>;
    booksFolderId?: string;
    coversFolderId?: string;
  };

  @IsOptional()
  cloudinary?: {
    enabled?: boolean;
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    folder?: string;
  };

  @IsOptional()
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    senderEmail?: string;
  };

  @IsOptional()
  system?: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
  };

  @IsOptional()
  @IsBoolean()
  launchMode?: boolean;

  @IsOptional()
  launchDate?: Date | string | null;

  @IsOptional()
  @IsString()
  comingSoonTitle?: string;

  @IsOptional()
  @IsString()
  comingSoonSubtitle?: string;

  @IsOptional()
  @IsString()
  comingSoonBg?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  tiktokUrl?: string;
}

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
