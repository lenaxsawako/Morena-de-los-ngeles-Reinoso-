import { HttpException, HttpStatus, ConflictException, BadRequestException } from '@nestjs/common';

export class SecurityException extends HttpException {
  constructor(message?: string, status: HttpStatus = HttpStatus.FORBIDDEN) {
    super(message || 'Security exception', status);
  }
}

export class IdempotencyConflictException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Request is already being processed (idempotency conflict)');
  }
}

export class IdempotencyKeyMissingException extends BadRequestException {
  constructor(headerName = 'idempotency-key') {
    super(`Missing idempotency header: ${headerName}`);
  }
}
