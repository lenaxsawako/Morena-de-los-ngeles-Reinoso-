import { Injectable, Inject } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(@Inject(NestJwtService) private readonly jwtService: NestJwtService) {}

  signToken(payload: Record<string, any>): string {
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });
  }

  verifyToken<T extends object = Record<string, any>>(token: string): T {
    return this.jwtService.verify<T>(token);
  }

  signRefreshToken(payload: Record<string, any>): string {
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });
  }

  verifyRefreshToken<T extends object = Record<string, any>>(token: string): T {
    return this.jwtService.verify<T>(token);
  }

  decode(token: string): Record<string, any> | null {
    return this.jwtService.decode(token);
  }
}
