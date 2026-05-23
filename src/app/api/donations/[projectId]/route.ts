import { NextRequest, NextResponse } from 'next/server';
import { DonationService } from '@/lib/services/donation.service';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { projectId } = await params;
    const [donations, topDonors] = await Promise.all([
      DonationService.getProjectDonations(projectId),
      DonationService.getTopDonors(projectId, 5),
    ]);
    return NextResponse.json({ donors: donations, topDonors, stats: { totalDonors: donations.length } });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}