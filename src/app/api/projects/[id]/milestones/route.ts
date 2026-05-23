
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { ProjectService } from '@/lib/services/project.service';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const { milestoneId } = await request.json();
      const project = await ProjectService.completeMilestone(id, payload.userId, milestoneId);
      return NextResponse.json({ message: 'Milestone completed', project });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}