import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ userId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await params;
    const user = await UserService.getById(userId);
    return NextResponse.json({ followers: user.followers, following: user.following });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}