import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceCents?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  previewPages?: number;

  @IsString()
  @IsOptional()
  categoryRef?: string;

  @IsString()
  @IsOptional()
  polarProductId?: string;

  @IsString()
  @IsOptional()
  prequelRef?: string;

  @IsString()
  @IsOptional()
  authorNotes?: string;
}
