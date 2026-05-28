import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Donation from '@/lib/models/Donation';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers, newUsersThisMonth, ngoCount,
        totalProjects, activeProjects, completedProjects, pendingProjects, newProjectsThisWeek,
        donationAggr, recentDonationAggr,
        categoryBreakdown, topDonors, dailySignups,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ isNGO: true }),

        Project.countDocuments(),
        Project.countDocuments({ status: 'active' }),
        Project.countDocuments({ status: 'completed' }),
        Project.countDocuments({ status: 'pending' }),
        Project.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

        Donation.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Donation.aggregate([
          { $match: { status: 'completed', donatedAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),

        Project.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 }, raised: { $sum: '$totalDonations' } } },
          { $sort: { count: -1 } },
        ]),

        Donation.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$userId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { total: 1, count: 1, 'user.name': 1, 'user.avatar': 1, 'user.email': 1 } },
        ]),

        User.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      return NextResponse.json({
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          ngoCount,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          pending: pendingProjects,
          newThisWeek: newProjectsThisWeek,
        },
        donations: {
          totalAmount: donationAggr[0]?.total ?? 0,
          totalCount:  donationAggr[0]?.count ?? 0,
          thisMonthAmount: recentDonationAggr[0]?.total ?? 0,
          thisMonthCount:  recentDonationAggr[0]?.count ?? 0,
        },
        categoryBreakdown,
        topDonors,
        dailySignups,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}
