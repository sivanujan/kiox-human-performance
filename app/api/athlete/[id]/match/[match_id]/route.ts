import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string, match_id: string } }
) {
  const athleteId = params.id;
  const matchId = params.match_id;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: match, error } = await supabase
    .from('match_stats')
    .select('*')
    .eq('user_id', athleteId)
    .eq('match_id', matchId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: "Game Registry Entry Not Found." }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(match);
}
