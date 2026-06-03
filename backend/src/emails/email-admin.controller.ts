import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { EmailStatus } from '../models/email.schema';

@Controller('admin/emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EmailAdminController {
  constructor(private emailService: EmailService) {}

  @Get()
  async getAllEmails(
    @Query('status') status?: EmailStatus,
    @Query('limit') limit: string = '50',
    @Query('skip') skip: string = '0',
  ) {
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skipNum = parseInt(skip) || 0;
    return this.emailService.findAll(status, limitNum, skipNum);
  }

  @Get('statistics')
  async getStatistics() {
    return this.emailService.getStatistics();
  }

  @Get('pending')
  async getPendingEmails() {
    const { data } = await this.emailService.findAll(EmailStatus.PENDING);
    return { data };
  }

  @Get(':id')
  async getEmailById(@Param('id') id: string) {
    const email = await this.emailService.findById(id);
    if (!email) {
      throw new BadRequestException('Email not found');
    }
    return email;
  }

  @Post(':id/send')
  async sendEmail(@Param('id') id: string) {
    const email = await this.emailService.findById(id);
    if (!email) {
      throw new BadRequestException('Email not found');
    }
    await this.emailService.send(id);
    return { message: 'Email sent successfully' };
  }

  @Post('retry-failed')
  async retryFailedEmails(@Query('maxAttempts') maxAttempts: string = '3') {
    await this.emailService.retryFailedEmails(parseInt(maxAttempts) || 3);
    return { message: 'Failed emails retry initiated' };
  }

  @Post(':id/mark-read')
  async markAsRead(@Param('id') id: string) {
    const email = await this.emailService.markAsRead(id);
    return email;
  }

  @Post('create')
  async createEmail(
    @Body()
    body: {
      recipient: string;
      subject: string;
      bodyText: string;
      htmlBody?: string;
      template?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const { recipient, subject, bodyText, htmlBody, template, metadata } = body;

    if (!recipient || !subject || !bodyText) {
      throw new BadRequestException(
        'recipient, subject and bodyText are required',
      );
    }

    return this.emailService.sendEmail(
      recipient,
      subject,
      bodyText,
      htmlBody || bodyText,
      template as any,
      metadata,
    );
  }

  @Delete(':id')
  async deleteEmail(@Param('id') id: string) {
    const email = await this.emailService.findById(id);
    if (!email) {
      throw new BadRequestException('Email not found');
    }
    await this.emailService.delete(id);
    return { message: 'Email deleted successfully' };
  }

  @Delete()
  async deleteAllEmails(@Query('status') status?: EmailStatus) {
    const result = await this.emailService.deleteAll(status);
    return result;
  }
}
