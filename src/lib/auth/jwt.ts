import jwt from 'jsonwebtoken';
import { TokenPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'madadkart-secret-change-in-production';
const JWT_EXPIRY = '7d';

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}