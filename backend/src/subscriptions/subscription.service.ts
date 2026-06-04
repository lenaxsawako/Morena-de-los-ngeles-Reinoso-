import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../models/subscription.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async subscribe(email: string, source: string = 'landing'): Promise<SubscriptionDocument> {
    const existing = await this.subscriptionModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Email already subscribed');
      }
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      return existing.save();
    }
    return this.subscriptionModel.create({ email: email.toLowerCase(), source });
  }

  async unsubscribe(email: string): Promise<void> {
    const sub = await this.subscriptionModel.findOne({ email: email.toLowerCase() });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    sub.isActive = false;
    sub.unsubscribedAt = new Date();
    await sub.save();
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: SubscriptionDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.subscriptionModel.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.subscriptionModel.countDocuments({ isActive: true }),
    ]);
    return { data, total };
  }

  async getAllActiveEmails(): Promise<string[]> {
    const subs = await this.subscriptionModel.find({ isActive: true }).select('email').lean().exec();
    return subs.map(s => s.email);
  }

  async findByEmail(email: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.subscriptionModel.countDocuments(),
      this.subscriptionModel.countDocuments({ isActive: true }),
    ]);
    return { total, active };
  }
}
