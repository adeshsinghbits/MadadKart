import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { NotificationService } from '@/lib/services/notification.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const notifications = await NotificationService.getForUser(payload.userId);
      const unreadCount = await NotificationService.getUnreadCount(payload.userId);
      return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      await NotificationService.markAllRead(payload.userId);
      return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}