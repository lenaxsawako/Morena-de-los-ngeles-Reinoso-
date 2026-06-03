import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { EmailService } from '../emails/email.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSubscriptionController {
  constructor(
    private subscriptionService: SubscriptionService,
    private emailService: EmailService,
  ) {}

  @Get()
  async listSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.subscriptionService.findAll(parseInt(page) || 1, parseInt(limit) || 50);
  }

  @Get('stats')
  async getStats() {
    return this.subscriptionService.getStats();
  }

  @Post('send-newsletter')
  async sendNewsletter(
    @Body()
    body: {
      subject: string;
      bodyText: string;
      htmlBody?: string;
    },
  ) {
    if (!body.subject || !body.bodyText) {
      throw new BadRequestException('Subject and bodyText are required');
    }

    const emails = await this.subscriptionService.getAllActiveEmails();
    if (emails.length === 0) {
      throw new BadRequestException('No active subscribers');
    }

    const results = { total: emails.length, sent: 0, failed: 0 };
    for (const email of emails) {
      try {
        await this.emailService.sendEmail(
          email,
          body.subject,
          body.bodyText,
          body.htmlBody || body.bodyText,
        );
        results.sent++;
      } catch {
        results.failed++;
      }
    }

    return {
      message: `Newsletter enviado a ${results.sent}/${results.total} suscriptores`,
      results,
    };
  }
}
