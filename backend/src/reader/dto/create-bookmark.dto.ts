import { IsNumber, IsString, IsOptional, IsNotEmpty, Min, MaxLength } from 'class-validator';

export class CreateBookmarkDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
