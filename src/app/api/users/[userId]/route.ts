import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const profile = await UserService.getUserProfile(userId);

    return NextResponse.json(profile);
  } catch (error) {
    const { statusCode, message } = handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const authHeader = request.headers.get('authorization');

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { verifyToken } = await import('@/lib/auth/jwt');

    const payload = verifyToken(token);

    if (!payload || payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const user = await UserService.updateUserProfile(
      userId,
      data
    );

    return NextResponse.json({
      message: 'Profile updated',
      user,
    });
  } catch (error) {
    const { statusCode, message } = handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}