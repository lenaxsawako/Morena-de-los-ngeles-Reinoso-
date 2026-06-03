import { IsString, IsNumber, IsOptional, IsISO8601, Min, Max, IsNotEmpty } from 'class-validator';

export class SyncGuestProgressItemDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsNumber()
  @Min(1)
  currentPage!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage!: number;

  @IsISO8601()
  lastReadAt!: string;
}

export class SyncGuestProgressDto {
  @IsOptional()
  items?: SyncGuestProgressItemDto[];
}
