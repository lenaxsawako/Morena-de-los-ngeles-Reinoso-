import { IsString, MaxLength, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePhilosophyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  @MinLength(1)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  authorImageUrl?: string;
}
