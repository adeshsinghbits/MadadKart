import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = 20;
      const users = await User.find().select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
      const total = await User.countDocuments();
      return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const { userId, action } = await request.json();
      let update: any = {};
      if (action === 'verify-ngo') update = { ngoVerified: true };
      else if (action === 'ban') update = { role: 'user', isVerified: false };
      else if (action === 'make-admin') update = { role: 'admin' };
      const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
      return NextResponse.json({ user });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}