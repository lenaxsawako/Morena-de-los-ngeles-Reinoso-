import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import { TransactionalService } from './transactional.service';

@Injectable()
export class TransactionalListener {
  private readonly logger = new Logger(TransactionalListener.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private transactionalService: TransactionalService,
  ) {}

  @OnEvent('user.registered')
  async handleUserRegistered(payload: { email: string; userId: string }) {
    try {
      const user = await this.userModel.findById(payload.userId).select('email profile').lean();
      if (!user) return;
      const name = user.profile?.username || user.email.split('@')[0];
      await this.transactionalService.sendWelcome(payload.email, name);
      this.logger.log(`Welcome email sent to ${payload.email}`);
    } catch (err: any) {
      this.logger.error(`Error sending welcome email: ${err.message}`);
    }
  }

  @OnEvent('auth.password-reset')
  async handlePasswordReset(payload: { email: string; token: string }) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://greendg.craftassist.cloud/book';
      const resetUrl = `${baseUrl}/reset-password/${payload.token}`;
      await this.transactionalService.sendPasswordReset(payload.email, resetUrl);
      this.logger.log(`Password reset email sent to ${payload.email}`);
    } catch (err: any) {
      this.logger.error(`Error sending password reset email: ${err.message}`);
    }
  }
}
