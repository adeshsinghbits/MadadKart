import Donation, { IDonation } from '@/lib/models/Donation';
import Project from '@/lib/models/Project';
import { connectDB } from '@/lib/db/mongodb';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import mongoose from 'mongoose';

export class DonationService {
  static async createDonation(data: {
    userId: string;
    projectId: string;
    message?: string;
    amount?: number;
  }): Promise<IDonation> {
    await connectDB();

    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const existingDonation = await Donation.findOne({
      userId: data.userId,
      projectId: data.projectId,
    });

    if (existingDonation) {
      throw new ValidationError('You have already donated to this project');
    }

    const donation = await Donation.create({
      userId: data.userId,
      projectId: data.projectId,
      message: data.message,
      amount: data.amount,
    });

    if (!project.donors.includes(new mongoose.Types.ObjectId(data.userId))) {
      project.donors.push(new mongoose.Types.ObjectId(data.userId));
      project.totalDonations += 1;
      await project.save();
    }

    return await donation.populate('userId', 'name email');
  }

  static async getProjectDonors(projectId: string): Promise<IDonation[]> {
    await connectDB();

    const project = await Project.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    return await Donation.find({ projectId })
      .populate('userId', 'name email _id')
      .sort({ donatedAt: -1 });
  }

  static async getUserDonations(userId: string): Promise<IDonation[]> {
    await connectDB();

    return await Donation.find({ userId })
      .populate('projectId', 'title category')
      .sort({ donatedAt: -1 });
  }

  static async getDonationStats(projectId: string): Promise<{
    totalDonors: number;
    recentDonors: number;
  }> {
    await connectDB();

    const total = await Donation.countDocuments({ projectId });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Donation.countDocuments({
      projectId,
      donatedAt: { $gte: sevenDaysAgo },
    });

    return {
      totalDonors: total,
      recentDonors: recent,
    };
  }
}
