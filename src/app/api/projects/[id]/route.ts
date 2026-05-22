import { NextRequest, NextResponse } from 'next/server';

import { ProjectService } from '@/lib/services/project.service';
import { verifyToken } from '@/lib/auth/jwt';
import { handleError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project =
      await ProjectService.getProjectById(id);

    return NextResponse.json(project);
  } catch (error) {
    const { statusCode, message } =
      handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader =
      request.headers.get('authorization');

    const token = authHeader?.startsWith(
      'Bearer '
    )
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const project =
      await ProjectService.updateProject(
        id,
        payload.userId,
        data
      );

    return NextResponse.json({
      message: 'Project updated',
      project,
    });
  } catch (error) {
    const { statusCode, message } =
      handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader =
      request.headers.get('authorization');

    const token = authHeader?.startsWith(
      'Bearer '
    )
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await ProjectService.deleteProject(
      id,
      payload.userId
    );

    return NextResponse.json({
      message: 'Project deleted',
    });
  } catch (error) {
    const { statusCode, message } =
      handleError(error);

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}