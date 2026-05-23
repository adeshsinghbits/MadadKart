import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Donation from '@/lib/models/Donation';
import { connectDB } from '@/lib/db/mongodb';
import { NotFoundError } from '@/lib/utils/errors';
import { NotificationService } from './notification.service';
import { Types } from 'mongoose';

export class UserService {
  static async getById(userId: string) {
    await connectDB();
    const user = await User.findById(userId).select('-password')
      .populate('followers', 'name avatar impactScore role ngoVerified')
      .populate('following', 'name avatar impactScore role ngoVerified');
    if (!user) throw new NotFoundError('User');
    return user;
  }

  static async getUserProfile(userId: string) {
  await connectDB();

  const user = await this.getById(userId);

  const [createdProjects, donations] = await Promise.all([
    Project.find({
      creator: userId,
    })
      .populate(
        'creator',
        'firstName lastName avatar'
      )
      .sort({
        createdAt: -1,
      })
      .limit(6)
      .lean(),

    Donation.find({
      donor: userId,
    })
      .populate(
        'project',
        `
          title
          category
          images
          location
          createdAt
          donorCount
          raisedAmount
          fundingGoal
          completionPercentage
        `
      )
      .sort({
        createdAt: -1,
      })
      .limit(6)
      .lean(),
  ]);

  const donatedProjects = donations
    .map((donation) => donation.project)
    .filter(Boolean);

  return {
    user,
    createdProjects,
    donatedProjects,
  };
}

  static async updateProfile(userId: string, data: Record<string, unknown>) {
    await connectDB();
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true }).select('-password');
    if (!user) throw new NotFoundError('User');
    return user;
  }

  // Legacy compat
  static async updateUserProfile(userId: string, data: Record<string, unknown>) {
    return this.updateProfile(userId, data);
  }

  static async follow(followerId: string, targetId: string) {
    await connectDB();
    if (followerId === targetId) throw new Error('Cannot follow yourself');
    const [follower, target] = await Promise.all([User.findById(followerId), User.findById(targetId)]);
    if (!follower || !target) throw new NotFoundError('User');

    const isFollowing = follower.following.some((id: Types.ObjectId) => id.toString() === targetId);
    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(followerId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: followerId } }),
      ]);
      return { following: false };
    } else {
      await Promise.all([
        User.findByIdAndUpdate(followerId, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: followerId } }),
      ]);
      await NotificationService.create({
        recipient: targetId, sender: followerId, type: 'new_follower',
        title: 'New Follower', message: `${follower.name} started following you`, link: `/profile/${followerId}`,
      });
      return { following: true };
    }
  }

  static async getLeaderboard(limit = 10) {
    await connectDB();
    return User.find().select('name avatar impactScore totalDonated badges role ngoVerified').sort({ impactScore: -1 }).limit(limit);
  }

  static async awardBadge(userId: string, badge: { id: string; name: string; icon: string; description: string }) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user || user.badges.some((b:any) => b.id === badge.id)) return;
    user.badges.push({ ...badge, earnedAt: new Date() });
    await user.save();
  }

  static async updateImpactScore(userId: string, delta: number) {
    await connectDB();
    await User.findByIdAndUpdate(userId, { $inc: { impactScore: delta } });
  }

  static async getDashboardStats(userId: string) {
    await connectDB();
    const [user, projectCount, donations] = await Promise.all([
      User.findById(userId).select('totalDonated volunteeringHours impactScore badges streakDays'),
      Project.countDocuments({ creator: userId }),
      Donation.find({ userId }).select('amount donatedAt'),
    ]);
    const monthlyDonations = donations.reduce((acc: Record<string, number>, d) => {
      const key = new Date(d.donatedAt).toISOString().slice(0, 7);
      acc[key] = (acc[key] || 0) + (d.amount || 0);
      return acc;
    }, {});
    return { user, projectCount, totalDonations: donations.length, monthlyDonations };
  }
}