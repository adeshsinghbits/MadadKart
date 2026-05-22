import User from '@/lib/models/User';
import { connectDB } from '@/lib/db/mongodb';
import { NotificationService } from './notification.service';
import { NotFoundError } from '@/lib/utils/errors';

export class UserService {
  static async getById(userId: string) {
    await connectDB();
    const user = await User.findById(userId)
      .populate('followers', 'name avatar impactScore')
      .populate('following', 'name avatar impactScore');
    if (!user) throw new NotFoundError('User');
    return user;
  }

  static async updateProfile(userId: string, data: Record<string, unknown>) {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!user) throw new NotFoundError('User');
    return user;
  }

  static async follow(followerId: string, targetId: string) {
    await connectDB();
    if (followerId === targetId) throw new Error('Cannot follow yourself');

    const [follower, target] = await Promise.all([
      User.findById(followerId),
      User.findById(targetId),
    ]);
    if (!follower || !target) throw new NotFoundError('User');

    const isFollowing = follower.following.some(
      (id: string | { toString: () => string }) =>
        id.toString() === targetId
    );

    if (isFollowing) {
      await User.findByIdAndUpdate(followerId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: followerId } });
      return { following: false };
    } else {
      await User.findByIdAndUpdate(followerId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: followerId } });
      await NotificationService.create({
        recipient: targetId,
        sender: followerId,
        type: 'new_follower',
        title: 'New Follower',
        message: `${follower.name} started following you`,
        link: `/profile/${followerId}`,
      });
      return { following: true };
    }
  }

  static async getLeaderboard(limit = 10) {
    await connectDB();
    return User.find()
      .select('name avatar impactScore totalDonated badges role ngoVerified')
      .sort({ impactScore: -1 })
      .limit(limit);
  }

  static async awardBadge(userId: string, badge: { id: string; name: string; icon: string; description: string }) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return;
    const alreadyHas = user.badges.some(
      (b: { id?: string }) => b.id === badge.id
    );
    if (!alreadyHas) {
      user.badges.push({ ...badge, earnedAt: new Date() });
      await user.save();
    }
  }

  static async updateImpactScore(userId: string, delta: number) {
    await connectDB();
    await User.findByIdAndUpdate(userId, { $inc: { impactScore: delta } });
  }
}