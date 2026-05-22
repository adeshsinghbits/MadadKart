import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth/jwt';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { TokenPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload & { role: string };
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>,
  requiredRole?: string
): Promise<NextResponse> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (requiredRole) {
    await connectDB();
    const user = await User.findById(payload.userId).select('role');
    if (!user || user.role !== requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return handler(request, payload);
}

export async function getCurrentUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

