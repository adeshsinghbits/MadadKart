import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { AuthService } from '@/lib/services/auth.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const user = await AuthService.getMe(payload.userId);
      return NextResponse.json({ user });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}