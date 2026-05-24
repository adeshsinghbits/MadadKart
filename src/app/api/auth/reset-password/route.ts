import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Token, email and new password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    // Hash the raw token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }, // not expired
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      return NextResponse.json({ error: 'Reset link is invalid or has expired.' }, { status: 400 });
    }

    // Set new password — pre-save hook will hash it
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — validate token before the form renders (lightweight check)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) return NextResponse.json({ valid: false });

    await connectDB();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('_id name');

    return NextResponse.json({ valid: !!user, name: user?.name });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
