import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { sendEmail, buildPasswordResetEmail } from '@/lib/utils/email';
import { rateLimit } from '@/lib/middlewares/rateLimit';

export async function POST(request: NextRequest) {
  // Rate-limit: 5 requests per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');

    // Always return success to prevent email enumeration
    const GENERIC_OK = { message: 'If that email is registered, a reset link has been sent.' };

    if (!user) return NextResponse.json(GENERIC_OK);

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const emailPayload = buildPasswordResetEmail(user.name, resetUrl);
    emailPayload.to = user.email;

    try {
      await sendEmail(emailPayload);
    } catch (emailErr) {
      // Roll back token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', emailErr);
      return NextResponse.json({ error: 'Could not send reset email. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json(GENERIC_OK);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}