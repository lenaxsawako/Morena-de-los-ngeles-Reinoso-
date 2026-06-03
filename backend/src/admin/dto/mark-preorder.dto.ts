import { IsISO8601, IsNotEmpty } from 'class-validator';

export class MarkPreorderDto {
  @IsISO8601()
  @IsNotEmpty()
  releaseDate!: string;
}
