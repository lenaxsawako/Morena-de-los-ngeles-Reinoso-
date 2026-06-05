import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketStatus } from '../../models/support-ticket.schema';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  adminReply?: string;
}
