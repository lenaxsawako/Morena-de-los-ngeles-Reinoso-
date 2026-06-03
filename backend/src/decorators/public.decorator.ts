import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route handler as public (skip auth guards).
 * Usage: @Public() on controller method
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
