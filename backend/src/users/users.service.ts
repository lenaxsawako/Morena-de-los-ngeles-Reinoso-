import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
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
}
