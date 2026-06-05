import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../models/user.schema';
import { USER_MODEL } from '../models';
import { RedisStoreService } from '../services/redis-store.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(USER_MODEL) private userModel: Model<UserDocument>,
    private redisStore: RedisStoreService,
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

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { passwordHash });
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new InternalServerErrorException('User not found');

    const userObjId = new Types.ObjectId(userId);
    const originalEmail = user.email;

    const db = this.userModel.db;

    await Promise.all([
      db.collection('readingprogresses').deleteMany({ userRef: userObjId }),
      db.collection('readingsessions').deleteMany({ userRef: userObjId }),
      db.collection('bookmarks').deleteMany({ userRef: userObjId }),
      db.collection('favorites').deleteMany({ userRef: userObjId }),
      db.collection('subscriptions').deleteOne({ email: originalEmail }),
    ]);

    const randomHash = await bcrypt.hash('deleted_' + Math.random().toString(36), 10);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        email: `deleted_${userId}@deleted.com`,
        passwordHash: randomHash,
        'profile.username': 'Usuario eliminado',
        'profile.bio': '',
        'profile.avatar': '',
      },
      $unset: {
        emailVerificationToken: '',
        passwordResetToken: '',
        passwordResetExpiresAt: '',
      },
    });

    await this.redisStore.set(`revoked:${userId}`, '1', 30 * 24 * 60 * 60 * 1000);

    this.logger.log(`Account deleted: ${userId}`);
  }
}
