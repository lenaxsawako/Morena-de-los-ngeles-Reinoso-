import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IpExtractorService {
  getIpFromRequest(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? null;
  }

  // Upstream compatibility alias
  getClientIp(req: Request): string | null {
    return this.getIpFromRequest(req);
  }
}
