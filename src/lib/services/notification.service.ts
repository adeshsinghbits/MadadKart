import Notification from '@/lib/models/Notification';
import { connectDB } from '@/lib/db/mongodb';

export class NotificationService {
  static async create(data: {
    recipient: string;
    sender?: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }) {
    await connectDB();
    return Notification.create(data);
  }

  static async getForUser(userId: string, limit = 20) {
    await connectDB();
    return Notification.find({ recipient: userId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async markAllRead(userId: string) {
    await connectDB();
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }

  static async getUnreadCount(userId: string) {
    await connectDB();
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }
}