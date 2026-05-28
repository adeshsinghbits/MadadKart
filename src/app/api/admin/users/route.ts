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
      const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
      const limit  = 20;
      const search = searchParams.get('search') || '';
      const role   = searchParams.get('role')   || '';

      const query: any = {};
      if (search) query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      if (role) query.role = role;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(query),
      ]);

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
      if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 });

      // Prevent self-demotion
      if (userId === payload.userId && action === 'ban') {
        return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 });
      }

      const updateMap: Record<string, any> = {
        'verify-ngo':   { ngoVerified: true, isNGO: true },
        'unverify-ngo': { ngoVerified: false },
        'ban':          { isVerified: false },
        'unban':        { isVerified: true },
        'make-admin':   { role: 'admin' },
        'remove-admin': { role: 'user' },
        'make-ngo':     { role: 'ngo', isNGO: true },
      };

      const update = updateMap[action];
      if (!update) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

      const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      return NextResponse.json({ user, message: `Action "${action}" applied` });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      if (userId === payload.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

      await connectDB();
      await User.findByIdAndDelete(userId);
      return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}
