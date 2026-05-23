import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { UserService } from '@/lib/services/user.service';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { userId } = await params;
      const result = await UserService.follow(payload.userId, userId);
      return NextResponse.json(result);
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}