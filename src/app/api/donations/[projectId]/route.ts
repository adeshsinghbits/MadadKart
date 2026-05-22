import { NextRequest, NextResponse } from 'next/server';
import { DonationService } from '@/lib/services/donation.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    const donations =
      await DonationService.getProjectDonors(projectId);

    const stats =
      await DonationService.getDonationStats(projectId);

    return NextResponse.json({
      donors: donations,
      stats,
    });
  } catch (error) {
    const { statusCode, message } = handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}