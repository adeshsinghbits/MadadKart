import { NextRequest, NextResponse } from 'next/server';
import { DonationService } from '@/lib/services/donation.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const donations = await DonationService.getProjectDonors(
      params.projectId
    );
    const stats = await DonationService.getDonationStats(params.projectId);

    return NextResponse.json({
      donors: donations,
      stats,
    });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
