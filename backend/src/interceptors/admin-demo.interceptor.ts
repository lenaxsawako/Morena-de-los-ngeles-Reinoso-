import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AdminDemoInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminDemoInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.roles?.includes('admin-demo') && WRITE_METHODS.includes(request.method)) {
      this.logger.warn(`Demo user ${user.userId} attempted ${request.method} ${request.url} — blocked`);
      return of({
        success: true,
        demo: true,
        message: 'Modo demo — los cambios no se guardan',
      });
    }

    return next.handle();
  }
}
