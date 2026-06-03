import { UnauthorizedException, BadRequestException } from '@nestjs/common';

export class AuthException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Authentication failed');
  }
}

export class TokenNotFoundException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Authorization token not found');
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Invalid or expired token');
  }
}
