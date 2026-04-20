import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'latest';
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (period === 'latest') {
    const { data: latest, error } = await supabase
      .from('performance_logs')
      .select('*')
      .eq('user_id', athleteId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(latest || { message: "No data logs found." });
  }

  if (period === 'week') {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: logs, error } = await supabase
      .from('performance_logs')
      .select('*')
      .eq('user_id', athleteId)
      .gte('date', lastWeek)
      .order('date', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(logs);
  }

  return NextResponse.json({ error: "Invalid protocol period. Use 'latest' or 'week'." }, { status: 400 });
}
