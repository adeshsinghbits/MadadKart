import { NextRequest, NextResponse }  from 'next/server'
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
      const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit    = 20;
      const search   = searchParams.get('search')   || '';
      const category = searchParams.get('category') || '';
      const status   = searchParams.get('status')   || '';

      const query: any = {};
      if (search)   query.$text = { $search: search };
      if (category) query.category = category;
      if (status)   query.status   = status;

      const [projects, total] = await Promise.all([
        Project.find(query)
          .populate('creator', 'name email avatar role ngoVerified')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Project.countDocuments(query),
      ]);

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
      if (!projectId || !action) return NextResponse.json({ error: 'projectId and action required' }, { status: 400 });

      const updateMap: Record<string, any> = {
        verify:   { isVerified: true },
        unverify: { isVerified: false },
        pause:    { status: 'paused' },
        activate: { status: 'active' },
        complete: { status: 'completed' },
      };

      const update = updateMap[action];
      if (!update) return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });

      const project = await Project.findByIdAndUpdate(projectId, update, { new: true })
        .populate('creator', 'name email avatar');
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

      return NextResponse.json({ project, message: `Action "${action}" applied` });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');
      if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      await connectDB();
      await Project.findByIdAndDelete(projectId);
      return NextResponse.json({ message: 'Project deleted' });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}
