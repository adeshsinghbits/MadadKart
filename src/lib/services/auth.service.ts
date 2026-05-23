import User from '@/lib/models/User';
import { connectDB } from '@/lib/db/mongodb';
import { generateToken } from '@/lib/auth/jwt';
import { ValidationError, AuthenticationError } from '@/lib/utils/errors';

export class AuthService {
  static async register(data: { name: string; email: string; password: string; role?: string }) {
    await connectDB();
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new ValidationError('Email already registered');

    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role === 'ngo' ? 'ngo' : 'user',
      isNGO: data.role === 'ngo',
    });

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const obj = user.toObject() as any;
    delete obj.password;
    return { user: obj, token };
  }

  static async login(email: string, password: string) {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) throw new AuthenticationError('Invalid credentials');

    const ok = await user.comparePassword(password);
    if (!ok) throw new AuthenticationError('Invalid credentials');

    await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const obj = user.toObject() as any;
    delete obj.password;
    return { user: obj, token };
  }

  static async getMe(userId: string) {
    await connectDB();
    const user = await User.findById(userId).select('-password');
    if (!user) throw new AuthenticationError('User not found');
    return user;
  }
}