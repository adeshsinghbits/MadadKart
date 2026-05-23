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
      const project = await ProjectService.applyVolunteer(id, payload.userId, data);
      return NextResponse.json({ message: 'Volunteer application submitted', project });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const { volunteerId, status } = await request.json();
      const project = await ProjectService.updateVolunteerStatus(id, payload.userId, volunteerId, status);
      return NextResponse.json({ message: `Volunteer ${status}`, project });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}