import User, { IUser } from '@/lib/models/User';
import { connectDB } from '@/lib/db/mongodb';
import { NotFoundError } from '@/lib/utils/errors';
import Project from '@/lib/models/Project';
import Donation from '@/lib/models/Donation';

export class UserService {
  static async getUserProfile(userId: string): Promise<{
    user: IUser;
    createdProjects: any[];
    donatedProjects: any[];
  }> {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const createdProjects = await Project.find({ creator: userId })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    const donations = await Donation.find({ userId })
      .populate('projectId')
      .sort({ donatedAt: -1 });

    const donatedProjects = donations.map((d: any) => d.projectId);

    const userObject = user.toObject();
    delete (userObject as any).password;

    return {
      user: userObject as IUser,
      createdProjects,
      donatedProjects,
    };
  }

  static async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<IUser> {
    await connectDB();

    const user = await User.findByIdAndUpdate(userId, data, { new: true });
    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }
}