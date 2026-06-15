import { createServiceClient } from '@/utils/supabase/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const adminDb = createServiceClient();

  try {
    // 1. Fetch staff profiles
    const { data: staffProfiles, error: profileError } = await adminDb
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role')
      .eq('role', 'staff');

    if (profileError) throw profileError;

    // 2. Fetch coach availability and schedules
    const [availRes, schedRes] = await Promise.all([
      adminDb.from('coach_availability').select('*'),
      adminDb.from('coach_schedule').select('*')
    ]);

    if (availRes.error) throw availRes.error;
    if (schedRes.error) throw schedRes.error;

    // 3. Merge availability data
    const mergedCoaches = (staffProfiles || []).map(profile => ({
      ...profile,
      availability: availRes.data?.find(a => a.coach_id === profile.id) || null,
      schedule: schedRes.data?.filter(s => s.coach_id === profile.id) || []
    }));

    return NextResponse.json({ coaches: mergedCoaches });
  } catch (err: any) {
    console.error('Public coaches fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
