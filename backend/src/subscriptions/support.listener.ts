import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransactionalService } from './transactional.service';

@Injectable()
export class SupportListener {
  constructor(private transactionalService: TransactionalService) {}

  @OnEvent('support.ticket.created')
  async handleTicketCreated(payload: { email: string; name: string; ticketId: string }) {
    await this.transactionalService.sendTicketConfirmation(payload.email, payload.name, payload.ticketId);
  }

  @OnEvent('support.ticket.replied')
  async handleTicketReplied(payload: { email: string; name: string; ticketId: string; adminReply: string }) {
    await this.transactionalService.sendTicketReply(payload.email, payload.name, payload.ticketId, payload.adminReply);
  }
}
