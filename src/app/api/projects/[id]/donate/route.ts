import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { DonationService } from '@/lib/services/donation.service';
import { handleError } from '@/lib/utils/errors';
import { donateSchema } from '@/lib/validators/project.validator';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = donateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
            {
            error: parsed.error.issues[0]?.message || "Validation failed",
            },
            { status: 400 }
        );
        }
      const donation = await DonationService.donate(payload.userId, id, parsed.data);
      return NextResponse.json({ message: 'Donation recorded', donation }, { status: 201 });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (type === 'top') {
      const donors = await DonationService.getTopDonors(id);
      return NextResponse.json({ donors });
    }
    const donations = await DonationService.getProjectDonations(id);
    return NextResponse.json({ donations });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}