export interface JwtPayload {
  sub: string | number;
  email?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}
