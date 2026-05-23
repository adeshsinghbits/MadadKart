
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { withAuth } from '@/lib/middlewares/auth';
import { handleError } from '@/lib/utils/errors';
import { updateProfileSchema } from '@/lib/validators/user.validator';

type Params = { params: Promise<{ userId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const profile = await UserService.getUserProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { userId } = await params;
      if (payload.userId !== userId && payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const body = await request.json();
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: parsed.error.issues[0]?.message || "Validation failed",
          },
          { status: 400 }
        );
      }
      const user = await UserService.updateProfile(userId, parsed.data);
      return NextResponse.json({ message: 'Profile updated', user });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}