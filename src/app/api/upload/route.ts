import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
      const formDataCloud = new FormData();
      formDataCloud.append('file', base64);
      formDataCloud.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'madadkart');
      formDataCloud.append('folder', 'madadkart');

      const cloudRes = await fetch(cloudinaryUrl, { method: 'POST', body: formDataCloud });
      if (!cloudRes.ok) {
        // Return a placeholder if Cloudinary not configured
        return NextResponse.json({ url: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}` });
      }
      const cloudData = await cloudRes.json();
      return NextResponse.json({ url: cloudData.secure_url });
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  });
}