import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAthleteId(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_of')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'parent' && profile.parent_of) {
    return profile.parent_of;
  }
  return userId;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const athleteId = await getAthleteId(supabase, user.id);

  // Fetch performance logs for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from("performance_logs")
    .select("*")
    .eq("user_id", athleteId)
    .gte("date", ninetyDaysAgo.toISOString().split('T')[0])
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

