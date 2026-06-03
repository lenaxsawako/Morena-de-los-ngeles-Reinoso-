import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { InsufficientRolesException } from '../exceptions/permissions.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      this.logger.error('User not found in request — RolesGuard must run after JwtAuthGuard');
      throw new InsufficientRolesException(requiredRoles);
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      this.logger.warn(`${user.username} lacks roles [${requiredRoles.join(', ')}]. Has: [${user.roles?.join(', ') ?? 'none'}]`);
      throw new InsufficientRolesException(requiredRoles);
    }

    this.logger.debug(`${user.username} — roles ok: [${requiredRoles.join(', ')}]`);
    return true;
  }
}
