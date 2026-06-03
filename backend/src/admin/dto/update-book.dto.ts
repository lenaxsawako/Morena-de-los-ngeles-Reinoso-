import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceCents?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  previewPages?: number;

  @IsString()
  @IsOptional()
  categoryRef?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  polarProductId?: string;
}

export class AttachDriveFileDto {
  @IsString()
  driveFileId!: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fileSize?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPages?: number;
}
