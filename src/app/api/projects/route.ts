import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { withAuth } from '@/lib/middlewares/auth';
import { handleError } from '@/lib/utils/errors';
import { createProjectSchema } from '@/lib/validators/project.validator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
    };
    const { projects, total } = await ProjectService.getAllProjects(filters);
    return NextResponse.json({ projects, total, page: filters.page, limit: filters.limit, pages: Math.ceil(total / filters.limit) });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const body = await request.json();
      const parsed = createProjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: parsed.error.issues[0]?.message || "Validation failed",
          },
          { status: 400 }
        );
      }
      const project = await ProjectService.createProject(payload.userId, parsed.data);
      return NextResponse.json({ message: 'Project created', project }, { status: 201 });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}