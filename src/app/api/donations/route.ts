import { NextRequest, NextResponse } from 'next/server';
import { DonationService } from '@/lib/services/donation.service';
import { verifyToken } from '@/lib/auth/jwt';
import { handleError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { projectId, message, amount } = await request.json();

    const donation = await DonationService.createDonation({
      userId: payload.userId,
      projectId,
      message,
      amount,
    });

    return NextResponse.json(
      { message: 'Donation created', donation },
      { status: 201 }
    );
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
