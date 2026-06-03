import { IsBoolean, IsISO8601, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class PublishBookDto {
  @IsOptional()
  @IsBoolean()
  asPreorder?: boolean;

  @ValidateIf((o) => o.asPreorder === true)
  @IsISO8601()
  @IsNotEmpty()
  releaseDate?: string;
}
