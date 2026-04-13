import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: notes, error } = await supabase
    .from('trainer_notes')
    .select('*, added_by(first_name, last_name)')
    .eq(userId ? 'user_id' : '', userId || '')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, note } = await request.json();
    const { data, error } = await supabase
      .from('trainer_notes')
      .insert({ user_id: userId, added_by: authUser.id, note })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
