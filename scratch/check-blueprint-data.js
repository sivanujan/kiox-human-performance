
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  console.log('--- SESSION TEMPLATES (BLUEPRINT MODULES) ---');
  const { data: templates, error: tErr } = await supabase.from('session_templates').select('*');
  if (tErr) console.error(tErr);
  else console.table(templates.map(t => ({ title: t.title, day: t.day_of_week, time: t.start_time })));

  console.log('\n--- TRAINING SESSIONS (ACTUAL SCHEDULE) ---');
  const { data: sessions, error: sErr } = await supabase.from('training_sessions').select('*').limit(10);
  if (sErr) console.error(sErr);
  else console.table(sessions.map(s => ({ title: s.title, date: s.scheduled_date, time: s.start_time })));
}

checkData();
