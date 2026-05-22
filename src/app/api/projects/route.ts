import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { verifyToken } from '@/lib/auth/jwt';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const { projects, total } = await ProjectService.getAllProjects({
      category: category,
      search: search,
      page,
      limit,
    });

    return NextResponse.json({
      projects,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const project = await ProjectService.createProject(
      payload.userId,
      data
    );

    return NextResponse.json(
      { message: 'Project created', project },
      { status: 201 }
    );
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

