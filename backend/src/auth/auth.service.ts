import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../emails/email.service';
import { UserRole } from '../models/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(email: string, password: string) {
    const user = await this.usersService.create(email, password);
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      isAdmin: user.roles?.includes(UserRole.ADMIN) || false,
    };
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

    const token = await this.usersService.generatePasswordResetToken(email);
    const resetUrl = `${process.env.FRONTEND_URL || 'https://greendg.craftassist.cloud/book'}/reset-password/${token}`;

    await this.emailService.sendEmail(
      email,
      'Restablece tu contraseña',
      `Usa este enlace para restablecer tu contraseña: ${resetUrl}`,
      `<p>Hacé click para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    await this.usersService.resetPassword(token, newPassword);
  }
}
