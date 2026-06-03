import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({
  timestamps: true,
})
export class User {

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: true,
  })
  passwordHash!: string;

  @Prop({
    default: [],
  })
  purchasedBooks!: string[];

  @Prop({
    enum: UserRole,
    type: [String],
    default: [UserRole.USER],
  })
  roles!: UserRole[];

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    default: false,
  })
  emailVerified!: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpiresAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop({
    type: Object,
    default: {},
  })
  profile!: {
    username?: string;
    avatar?: string;
    bio?: string;
  };

  @Prop({
    type: Object,
    default: {},
  })
  preferences!: {
    theme?: 'dark' | 'light';
    fontSize?: number;
  };

  @Prop({
    type: Object,
    default: {},
  })
  metadata!: Record<string, unknown>;
}

export const UserSchema =
  SchemaFactory.createForClass(User);