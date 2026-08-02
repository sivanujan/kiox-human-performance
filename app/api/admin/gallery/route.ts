import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const supabaseAdmin = createAdminClient();

  // 1. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role?.toLowerCase() || '';
  if (role !== 'superadmin' && role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    let fileBuffer: Buffer;
    let fileNameOriginal = '';
    let title = 'Untitled';
    let type = 'image';
    let category = 'TRAINING';

    const headerFileName = request.headers.get('x-file-name');

    if (headerFileName) {
      // 1. Binary Direct Stream (Used for videos and large files to bypass FormData parsing limits)
      fileNameOriginal = decodeURIComponent(headerFileName);
      title = decodeURIComponent(request.headers.get('x-title') || fileNameOriginal);
      type = request.headers.get('x-type') || (fileNameOriginal.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video' : 'image');
      category = decodeURIComponent(request.headers.get('x-category') || 'TRAINING');

      const arrayBuffer = await request.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // 2. Standard FormData parsing
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      fileNameOriginal = file.name;
      title = (formData.get('title') as string) || file.name;
      type = (formData.get('type') as string) || (file.type.startsWith('video') ? 'video' : 'image');
      category = (formData.get('category') as string) || 'TRAINING';

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    const ext = fileNameOriginal.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Ensure directory exists (Next.js public folder)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/gallery/${fileName}`;

    // Write File to Disk
    await writeFile(filePath, fileBuffer);

    // Save to Database
    const supabaseAdmin = createAdminClient();
    
    // Get max order to append at the end
    const { data: latestItem } = await supabaseAdmin
      .from('gallery_items')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = (latestItem?.display_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('gallery_items')
      .insert({
        title,
        file_path: publicUrl,
        type,
        category,
        display_order: newOrder
      })
      .select()
      .single();

    if (error) {
      // Cleanup file if DB fails
      await unlink(filePath).catch(() => {});
      throw error;
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Gallery Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'No item ID provided' }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    // 2. Fetch the file path to delete from disk
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('gallery_items')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found in database' }, { status: 404 });
    }

    // 3. Delete from Database
    const { error: deleteError } = await supabaseAdmin
      .from('gallery_items')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 4. Delete from Disk
    const filePath = join(process.cwd(), 'public', item.file_path);
    await unlink(filePath).catch((err) => {
      console.warn(`File cleanup failed for ${filePath}:`, err);
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Gallery Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
