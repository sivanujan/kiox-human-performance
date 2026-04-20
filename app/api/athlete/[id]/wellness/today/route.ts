import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: wellness, error } = await supabase
    .from('wellness_logs')
    .select('*')
    .eq('user_id', athleteId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ message: "No check-in found for today. Protocol pending." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(wellness);
}
