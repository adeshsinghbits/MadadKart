    import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/models/Project';
import { handleError } from '@/lib/utils/errors';

type Params = { params: Promise<{ id: string }> };

/** GET /api/projects/[id]/gallery — public, returns all gallery items */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const project = await Project.findById(id)
      .select('gallery images pictureOfSuccess title')
      .populate('gallery.uploadedBy', 'name avatar');
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Merge cover images + gallery items into one unified response
    const coverImages = (project.images ?? []).map((url: string, i: number) => ({
      _id:        `cover_${i}`,
      url,
      caption:    i === 0 ? 'Cover image' : `Project image ${i + 1}`,
      isCover:    true,
      uploadedAt: project.createdAt,
    }));

    return NextResponse.json({
      gallery: project.gallery ?? [],
      coverImages,
      total:  (project.gallery?.length ?? 0) + coverImages.length,
    });
  } catch (error) {
    const { statusCode, message } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

/** POST /api/projects/[id]/gallery — add a photo (creator + accepted volunteers) */
export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      await connectDB();
      const project = await Project.findById(id);
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

      // Allow creator OR accepted volunteer to upload
      const isCreator   = project.creator.toString() === payload.userId;
      const isVolunteer = project.volunteers?.some(
        (v: any) => v.user.toString() === payload.userId && v.status === 'accepted'
      );
      if (!isCreator && !isVolunteer) {
        return NextResponse.json({ error: 'Only the project creator or accepted volunteers can upload photos' }, { status: 403 });
      }

      const { url, caption, width, height } = await request.json();
      if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

      const item = {
        url,
        caption: caption?.slice(0, 300) ?? '',
        uploadedBy: payload.userId,
        uploadedAt: new Date(),
        width,
        height,
      };

      project.gallery.push(item as any);
      await project.save();

      const saved = project.gallery[project.gallery.length - 1];
      return NextResponse.json({ item: saved, message: 'Photo added to gallery' }, { status: 201 });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

/** DELETE /api/projects/[id]/gallery?itemId=xxx — remove a gallery item */
export async function DELETE(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const itemId = searchParams.get('itemId');
      if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

      await connectDB();
      const project = await Project.findById(id);
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

      const item = project.gallery.id(itemId);
      if (!item) return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });

      // Only uploader or creator can delete
      const isCreator  = project.creator.toString() === payload.userId;
      const isUploader = item.uploadedBy?.toString() === payload.userId;
      if (!isCreator && !isUploader) {
        return NextResponse.json({ error: 'Not authorised to delete this photo' }, { status: 403 });
      }

      project.gallery.pull(itemId);
      await project.save();
      return NextResponse.json({ message: 'Photo removed from gallery' });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}

/** PATCH /api/projects/[id]/gallery — update caption */
export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(request, async (req, payload) => {
    try {
      const { id } = await params;
      const { itemId, caption } = await request.json();
      if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

      await connectDB();
      const project = await Project.findById(id);
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

      const item = project.gallery.id(itemId);
      if (!item) return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });

      const isCreator  = project.creator.toString() === payload.userId;
      const isUploader = item.uploadedBy?.toString() === payload.userId;
      if (!isCreator && !isUploader)
        return NextResponse.json({ error: 'Not authorised' }, { status: 403 });

      item.caption = caption?.slice(0, 300) ?? item.caption;
      await project.save();
      return NextResponse.json({ item, message: 'Caption updated' });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  });
}
