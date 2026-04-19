import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
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
    const { items } = await request.json(); // Expected: Array<{ id: string, display_order: number }>
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array provided' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Perform updates in parallel (Supabase doesn't have a bulk update for multiple rows with different values in one call easily)
    const updatePromises = items.map(item => 
      supabaseAdmin
        .from('gallery_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error).map(r => r.error);

    if (errors.length > 0) {
      console.error('Reorder Batch Errors:', errors);
      return NextResponse.json({ error: 'Failed to update some items', details: errors }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Gallery Reorder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
