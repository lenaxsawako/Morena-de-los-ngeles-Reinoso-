import { Controller, Get, Param, Patch, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { SupportService } from '../support/support.service';
import { UpdateTicketDto } from '../support/dto/update-ticket.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketStatus } from '../models/support-ticket.schema';
import { AdminDemoInterceptor } from '../interceptors/admin-demo.interceptor';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(AdminDemoInterceptor)
export class AdminSupportController {
  constructor(
    private supportService: SupportService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('tickets')
  async findAll(
    @Query('status') status?: TicketStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.findAll({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('tickets/:id')
  async findOne(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @Patch('tickets/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    const ticket = await this.supportService.update(id, dto);

    if (dto.adminReply) {
      this.eventEmitter.emit('support.ticket.replied', {
        email: ticket.email,
        name: ticket.name,
        ticketId: id,
        adminReply: dto.adminReply,
      });
    }

    return ticket;
  }
}
