import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { ProjectService } from '@/lib/services/project.service';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Donation from '@/lib/models/Donation';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const [projectStats, userCount, donationAggr] = await Promise.all([
        ProjectService.getStats(),
        User.countDocuments(),
        Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      ]);
      return NextResponse.json({ ...projectStats, userCount, totalAmount: donationAggr[0]?.total || 0, donationCount: donationAggr[0]?.count || 0 });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}