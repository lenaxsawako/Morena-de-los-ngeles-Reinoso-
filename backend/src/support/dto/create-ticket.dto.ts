import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(5)
  subject!: string;

  @IsString()
  @MinLength(20)
  message!: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}
