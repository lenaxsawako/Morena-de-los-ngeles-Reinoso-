import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { NewsletterService } from './newsletter.service';
import { TemplateService } from './template.service';
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
    private newsletterService: NewsletterService,
    private templateService: TemplateService,
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
    return this.newsletterService.getStats();
  }

  @Post('preview')
  async previewTemplate(
    @Body() body: { subject: string; content: string; email?: string },
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('Subject and content are required');
    }
    const email = body.email || 'test@example.com';
    const unsubscribeUrl = this.templateService.buildUnsubscribeUrl(email);
    const html = this.templateService.render({
      site_name: process.env.SITE_NAME || 'LBB',
      subject: body.subject,
      content: body.content,
      unsubscribe_url: unsubscribeUrl,
    });
    return { html };
  }

  @Post('send')
  async sendNewsletter(
    @Body() body: { subject: string; content: string; segment?: string },
  ) {
    if (!body.subject || !body.content) {
      throw new BadRequestException('Subject and content are required');
    }
    const campaign = await this.newsletterService.createCampaign({
      subject: body.subject,
      htmlContent: body.content,
      segment: body.segment as any,
    });
    const result = await this.newsletterService.sendCampaign(campaign._id.toString());
    return {
      message: `Newsletter enviado a ${result.sent}/${result.sent + result.failed} suscriptores`,
      results: result,
    };
  }

  @Post('campaigns')
  async createCampaign(@Body() body: {
    subject: string;
    htmlContent: string;
    segment?: string;
    scheduledAt?: string;
  }) {
    if (!body.subject || !body.htmlContent) {
      throw new BadRequestException('Subject and content are required');
    }
    const campaign = await this.newsletterService.createCampaign({
      subject: body.subject,
      htmlContent: body.htmlContent,
      segment: body.segment as any,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
    return campaign;
  }

  @Get('campaigns')
  async getCampaigns(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.newsletterService.getCampaigns(parseInt(page) || 1, parseInt(limit) || 20);
  }

  @Put('campaigns/:id/send')
  async sendCampaign(@Param('id') id: string) {
    const result = await this.newsletterService.sendCampaign(id);
    return {
      message: `Campaña enviada a ${result.sent}/${result.sent + result.failed} suscriptores`,
      results: result,
    };
  }
}