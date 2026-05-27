import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middlewares/auth';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, payload) => {
    try {
      const formData = await request.formData();
      const file     = formData.get('file') as File | null;
      const folder   = (formData.get('folder') as string | null) ?? 'madadkart';

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      if (!ALLOWED.includes(file.type))
        return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF are allowed' }, { status: 400 });
      if (file.size > MAX_SIZE)
        return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });

      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const cloudName   = process.env.CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'madadkart';

      if (!cloudName) {
        // Dev fallback — return a placeholder so the rest of the app still works
        console.warn('⚠️  CLOUDINARY_CLOUD_NAME not set — returning placeholder');
        return NextResponse.json({
          url:    `https://picsum.photos/seed/${Date.now()}/800/600`,
          width:  800,
          height: 600,
          publicId: `placeholder_${Date.now()}`,
        });
      }

      const fd = new FormData();
      fd.append('file',           base64);
      fd.append('upload_preset',  uploadPreset);
      fd.append('folder',         folder);
      fd.append('quality',        'auto');
      fd.append('fetch_format',   'auto');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
      );

      if (!cloudRes.ok) {
        const errText = await cloudRes.text();
        console.error('Cloudinary error:', errText);
        return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 502 });
      }

      const data = await cloudRes.json();
      return NextResponse.json({
        url:      data.secure_url,
        width:    data.width,
        height:   data.height,
        publicId: data.public_id,
      });
    } catch (err) {
      console.error('Upload error:', err);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  });
}
