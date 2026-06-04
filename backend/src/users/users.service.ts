import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../models/user.schema';
import { USER_MODEL } from '../models';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(USER_MODEL) private userModel: Model<UserDocument>,
  ) {}

  async create(email: string, password: string) {
    try {
      const exists = await this.userModel.findOne({ email });
      if (exists) {
        throw new BadRequestException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({
        email,
        passwordHash,
      });

      return user.toObject({ versionKey: false });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) return null;

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return null;

      return user.toObject({ versionKey: false });
    } catch (error) {
      throw new InternalServerErrorException('Error validating user');
    }
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userModel.findByIdAndUpdate(user._id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(user._id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }
}
