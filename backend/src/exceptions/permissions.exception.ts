import { ForbiddenException } from '@nestjs/common';

export class PermissionsException extends ForbiddenException {
  constructor(message?: string) {
    super(message || 'Insufficient permissions');
  }
}

export class InsufficientRolesException extends ForbiddenException {
  constructor(requiredRoles: string[] = []) {
    super(`Insufficient roles. Required: ${requiredRoles.join(', ')}`);
  }
}
