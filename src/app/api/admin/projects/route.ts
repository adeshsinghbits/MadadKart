import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/models/Project';
import { handleError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = 20;
      const projects = await Project.find().populate('creator', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
      const total = await Project.countDocuments();
      return NextResponse.json({ projects, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await connectDB();
      const { projectId, action } = await request.json();
      let update: any = {};
      if (action === 'verify') update = { isVerified: true };
      else if (action === 'pause') update = { status: 'paused' };
      else if (action === 'activate') update = { status: 'active' };
      const project = await Project.findByIdAndUpdate(projectId, update, { new: true });
      return NextResponse.json({ project });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}