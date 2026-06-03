import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateReadingProgressDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  currentPage!: number;
}
