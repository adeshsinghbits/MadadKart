import User from '@/lib/models/User';
import { IUser } from '@/types';
import { connectDB } from '@/lib/db/mongodb';
import { generateToken } from '@/lib/auth/jwt';
import { validateEmail, validatePassword } from '@/lib/utils/validation';
import {
  ValidationError,
  AuthenticationError,
} from '@/lib/utils/errors';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: IUser; token: string }> {
   const result = await connectDB();

    if (!validateEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    const { isValid, error } = validatePassword(data.password);
    if (!isValid) {
      throw new ValidationError(error || 'Invalid password');
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      isVerified: true,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const userObject = user.toObject();
    delete (userObject as any).password;

    return { user: userObject as IUser, token };
  }

  static async login(email: string, password: string): Promise<{
    user: IUser;
    token: string;
  }> {
    await connectDB();

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const userObject = user.toObject();
    delete (userObject as any).password;

    return { user: userObject as IUser, token };
  }
}
