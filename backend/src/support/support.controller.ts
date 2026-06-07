import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Public } from '../decorators/public.decorator';

@Controller('support')
@Public()
export class SupportController {
  constructor(
    private supportService: SupportService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('tickets')
  async create(@Body() dto: CreateTicketDto, @Req() req: any) {
    const userId = req.user?.userId;
    const ticket = await this.supportService.create(dto, userId);

    this.eventEmitter.emit('support.ticket.created', {
      email: ticket.email,
      name: ticket.name,
      ticketId: String(ticket._id),
    });

    return { ticketId: String(ticket._id), message: 'Tu consulta fue enviada correctamente' };
  }

  @Get('tickets/:id')
  async findOne(@Param('id') id: string) {
    return this.supportService.findById(id);
  }
}
