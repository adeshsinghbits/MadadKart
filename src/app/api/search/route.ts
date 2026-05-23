import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    if (!q.trim()) return NextResponse.json({ projects: [], total: 0 });
    const { projects, total } = await ProjectService.getAllProjects({ search: q, limit: 20 });
    return NextResponse.json({ projects, total });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}