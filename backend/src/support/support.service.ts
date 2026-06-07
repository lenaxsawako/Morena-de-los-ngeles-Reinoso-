import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportTicket, SupportTicketDocument, TicketStatus } from '../models/support-ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async create(dto: CreateTicketDto, userId?: string): Promise<SupportTicketDocument> {
    return this.ticketModel.create({
      userId: userId || null,
      email: dto.email,
      name: dto.name,
      subject: dto.subject,
      message: dto.message,
      orderId: dto.orderId || null,
      messages: [{ role: 'user', content: dto.message, createdAt: new Date() }],
    });
  }

  async findAll(query: { status?: TicketStatus; page: number; limit: number }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.ticketModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async findById(id: string) {
    const ticket = await this.ticketModel.findById(id).lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    const setFields: Record<string, unknown> = {};
    const pushFields: Record<string, unknown> = {};

    if (dto.status) setFields.status = dto.status;
    if (dto.adminReply !== undefined) {
      setFields.adminReply = dto.adminReply;
      setFields.repliedAt = new Date();
      pushFields.messages = { role: 'admin', content: dto.adminReply, createdAt: new Date() };
    }

    const updateDoc: Record<string, unknown> = { $set: setFields };
    if (Object.keys(pushFields).length > 0) {
      updateDoc.$push = pushFields;
    }

    const ticket = await this.ticketModel.findByIdAndUpdate(id, updateDoc, { new: true }).lean();
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
