import { Controller, Get, Post, Body, UseGuards, ConflictException, BadRequestException, NotFoundException, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post()
  async subscribe(@Body() body: { email: string; source?: string }) {
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      throw new BadRequestException('Invalid email address');
    }
    try {
      await this.subscriptionService.subscribe(body.email, body.source || 'landing');
      return { message: 'Suscripción exitosa' };
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      throw new BadRequestException('Error al suscribir');
    }
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    try {
      await this.subscriptionService.unsubscribe(body.email);
      return { message: 'Desuscripción exitosa' };
    } catch {
      throw new BadRequestException('Suscripción no encontrada');
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    const email = req.user.email;
    const sub = await this.subscriptionService.findByEmail(email);
    return {
      subscribed: sub?.isActive || false,
      email,
    };
  }
}