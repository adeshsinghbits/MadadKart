
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import Donation from '@/lib/models/Donation';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = 25;

      const [donations, total] = await Promise.all([
        Donation.find({ status: 'completed' })
          .populate('userId', 'name email avatar')
          .populate('projectId', 'title category')
          .sort({ donatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Donation.countDocuments({ status: 'completed' }),
      ]);

      return NextResponse.json({ donations, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}
