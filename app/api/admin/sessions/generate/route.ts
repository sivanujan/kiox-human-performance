import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addDays, format, startOfWeek, parseISO } from 'date-fns';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Verify admin/staff role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { mondayDate } = await request.json(); // Expected format: 'yyyy-MM-dd'
    const startOfTargetWeek = parseISO(mondayDate);

    // 2. Fetch all active templates
    const { data: templates, error: templateError } = await supabase
      .from('session_templates')
      .select('*')
      .eq('is_active', true);

    if (templateError) throw templateError;
    if (!templates || templates.length === 0) {
        return NextResponse.json({ message: "No active templates found." });
    }

    // 3. Generate sessions for each template
    const sessionsToInsert = templates.map(t => {
        // Calculate the actual date based on template day_of_week
        // Day 0 is Sunday, so if it's Monday start, we need to adjust
        // session_templates.day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // If we have MondayDate (WeekStartsOn 1), then:
        // Mon = MondayDate + 0 days? No, date-fns startOfWeek(1) gives Monday.
        // Let's assume day_of_week is standard JS (0=Sun).
        
        const sessionDate = addDays(startOfWeek(startOfTargetWeek, { weekStartsOn: 0 }), t.day_of_week);
        
        return {
            title: t.title,
            session_type: t.session_type,
            scheduled_date: format(sessionDate, 'yyyy-MM-dd'),
            scheduled_time: t.start_time,
            duration_minutes: t.duration_minutes,
            max_capacity: t.max_capacity,
            location: t.location,
            template_id: t.id,
            assigned_by: user.id,
            status: 'SCHEDULED'
        };
    });

    // 4. Batch insert into training_sessions
    // We should ideally check if sessions for this week already exist to avoid duplicates
    const { data: existingSessions } = await supabase
        .from('training_sessions')
        .select('id')
        .gte('scheduled_date', mondayDate)
        .lte('scheduled_date', format(addDays(startOfTargetWeek, 6), 'yyyy-MM-dd'));

    if (existingSessions && existingSessions.length > 0) {
        return NextResponse.json({ 
            error: "Sessions for this week already exist. Generation aborted to prevent duplicates." 
        }, { status: 400 });
    }

    const { error: insertError } = await supabase
        .from('training_sessions')
        .insert(sessionsToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ 
        success: true, 
        count: sessionsToInsert.length,
        message: `Successfully generated ${sessionsToInsert.length} sessions for the week.`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
