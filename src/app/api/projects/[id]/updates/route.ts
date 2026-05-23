import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { ProjectService } from '@/lib/services/project.service';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const data = await request.json();
      const project = await ProjectService.addUpdate(id, payload.userId, data);
      return NextResponse.json({ message: 'Update posted', project });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}