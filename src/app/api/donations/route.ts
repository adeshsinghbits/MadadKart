import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { DonationService } from '@/lib/services/donation.service';
import { handleError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const { projectId, message, amount, type, isAnonymous } = await request.json();
      if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      const donation = await DonationService.donate(payload.userId, projectId, {
        type: type || 'money', amount, message, isAnonymous: isAnonymous || false,
      });
      return NextResponse.json({ message: 'Donation recorded', donation }, { status: 201 });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const donations = await DonationService.getUserDonations(payload.userId);
      return NextResponse.json({ donations });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}