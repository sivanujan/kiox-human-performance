import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  let query = supabase
    .from('trainer_notes')
    .select('*');
  
  if (userId && userId !== 'null' && userId !== 'undefined') {
    query = query.eq('user_id', userId);
  }

  const { data: notes, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Notes Fetch Error:", error);
    return NextResponse.json({ 
      error: error.message, 
      details: error.details,
      hint: "Ensure you have created the trainer_notes table." 
    }, { status: 500 });
  }
  return NextResponse.json(notes || []);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profile?.role !== 'superadmin' && profile?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, note } = await request.json();
    
    // Validate note content
    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trainer_notes')
      .insert({ 
        user_id: userId || null, // Allow general logs if userId is missing
        added_by: authUser.id, 
        note: note 
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Notes Creation Error:", err);
    return NextResponse.json({ 
      error: err.message,
      details: err.details,
      hint: "Check if the athlete (userId) exists and you have staff permissions." 
    }, { status: 500 });
  }
}
