import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const { currentPassword, newPassword } = await request.json();

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      if (currentPassword === newPassword) {
        return NextResponse.json({ error: 'New password must differ from current password' }, { status: 400 });
      }

      await connectDB();
      const user = await User.findById(payload.userId).select('+password');
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

      user.password = newPassword;
      await user.save();

      return NextResponse.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}