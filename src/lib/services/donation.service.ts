import Donation from '@/lib/models/Donation';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import { connectDB } from '@/lib/db/mongodb';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';
import { nanoid } from 'crypto';

const BADGES = {
  firstDonation: { id: 'first_donation', name: 'First Donor', icon: '💝', description: 'Made your first donation' },
  topSupporter: { id: 'top_supporter', name: 'Top Supporter', icon: '🏆', description: 'Donated over ₹10,000 total' },
};

export class DonationService {
  static async donate(userId: string, projectId: string, data: {
    type: 'money' | 'items' | 'both';
    amount?: number;
    items?: { name: string; quantity: number }[];
    message?: string;
    isAnonymous?: boolean;
    isRecurring?: boolean;
    recurringInterval?: 'monthly' | 'weekly';
  }) {
    await connectDB();

    const project = await Project.findById(projectId).populate('creator', 'name');
    if (!project) throw new Error('Project not found');

    const donation = await Donation.create({
      userId,
      projectId,
      ...data,
      receiptId: `RCP-${nanoid().slice(0, 8).toUpperCase()}`,
      status: 'completed',
    });

    // Update project totals
    if (data.amount) {
      await Project.findByIdAndUpdate(projectId, {
        $inc: { totalDonations: data.amount },
        $addToSet: { donors: userId },
      });
    }

    // Update user stats
    if (data.amount) {
      await User.findByIdAndUpdate(userId, {
        $inc: { totalDonated: data.amount, impactScore: Math.floor(data.amount / 10) },
      });
    }

    // Check badges
    const donationCount = await Donation.countDocuments({ userId });
    if (donationCount === 1) {
      await UserService.awardBadge(userId, BADGES.firstDonation);
    }

    const user = await User.findById(userId).select('totalDonated name');
    if (user && user.totalDonated >= 10000) {
      await UserService.awardBadge(userId, BADGES.topSupporter);
    }

    // Notify project creator
    const creator = project.creator as any;
    if (creator && creator._id?.toString() !== userId) {
      const donorName = data.isAnonymous ? 'Someone' : (user?.name || 'A donor');
      await NotificationService.create({
        recipient: creator._id.toString(),
        sender: data.isAnonymous ? undefined : userId,
        type: 'new_donation',
        title: 'New Donation!',
        message: `${donorName} donated${data.amount ? ` ₹${data.amount}` : ' items'} to your project "${project.title}"`,
        link: `/projects/${projectId}`,
      });
    }

    return donation;
  }

  static async getProjectDonations(projectId: string, limit = 20) {
    await connectDB();
    return Donation.find({ projectId, status: 'completed' })
      .populate('userId', 'name avatar')
      .sort({ donatedAt: -1 })
      .limit(limit);
  }

  static async getTopDonors(projectId: string, limit = 10) {
    await connectDB();
    return Donation.aggregate([
      { $match: { projectId: require('mongoose').Types.ObjectId.createFromHexString(projectId), status: 'completed' } },
      { $group: { _id: '$userId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]);
  }

  static async getUserDonations(userId: string) {
    await connectDB();
    return Donation.find({ userId, status: 'completed' })
      .populate('projectId', 'title images category')
      .sort({ donatedAt: -1 });
  }
}