import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { RedisStoreService } from '../services/redis-store.service';
import { UserRole } from '../models/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
    private redisStore: RedisStoreService,
  ) {}

  async register(email: string, password: string) {
    const user = await this.usersService.create(email, password);
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      isAdmin: user.roles?.includes(UserRole.ADMIN) || false,
    };

    this.eventEmitter.emit('user.registered', { email, userId: user._id.toString() });

    return { access_token: this.jwtService.sign(payload) };
  }

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(email: string, password: string) {
    const valid = await this.usersService.validateUser(email, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = {
      email: valid.email,
      sub: valid._id.toString(),
      isAdmin: valid.roles?.includes(UserRole.ADMIN) || false,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    const userObject = user.toObject ? user.toObject({ versionKey: false }) : user;
    delete (userObject as any).passwordHash;
    return userObject;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const userId = user._id.toString();
    const token = this.jwtService.sign(
      { sub: userId, purpose: 'reset' },
      { expiresIn: '1h' },
    );

    await this.redisStore.set(`reset:${userId}`, token, 60 * 60 * 1000);

    this.eventEmitter.emit('auth.password-reset', { email, token });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('El enlace de recuperación ha expirado o no es válido');
    }

    if (payload.purpose !== 'reset') {
      throw new BadRequestException('El enlace de recuperación no es válido');
    }

    const stored = await this.redisStore.get(`reset:${payload.sub}`);
    if (!stored) {
      throw new BadRequestException('El enlace de recuperación ya fue usado o ha expirado');
    }

    await this.usersService.updatePassword(payload.sub, newPassword);

    await this.redisStore.del(`reset:${payload.sub}`);
  }
}
