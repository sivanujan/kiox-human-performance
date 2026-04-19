import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    
    // Get max order
    const { data: latest } = await supabaseAdmin
      .from('gallery_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = (latest?.display_order || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('gallery_categories')
      .insert({ name: name.toUpperCase(), display_order: newOrder })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('gallery_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
