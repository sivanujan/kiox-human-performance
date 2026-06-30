import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper to write logs to scratch/api-logs.txt
function logToFile(message: string) {
  try {
    const logDir = path.join(process.cwd(), "scratch");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "api-logs.txt");
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

export async function POST(req: NextRequest) {
  logToFile("POST request received at /api/admin/checkup");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    logToFile(`POST request body parsed: athlete_id=${body.athlete_id}, therapist_name=${body.therapist_name}, status=${body.status}`);

    logToFile("Executing insert query in Supabase...");
    const { error, data } = await supabase
      .from("functional_checkups")
      .insert(body)
      .select()
      .single();

    if (error) {
      logToFile(`Supabase insert database error: ${error.code} - ${error.message}`);
      throw error;
    }
    
    logToFile(`Supabase insert success! New record ID: ${data?.id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    logToFile(`POST catch block error: ${err.message || err}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  logToFile("PUT request received at /api/admin/checkup");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { id, ...updateData } = await req.json();
    logToFile(`PUT request body parsed: id=${id}, athlete_id=${updateData.athlete_id}`);

    logToFile("Executing update query in Supabase...");
    const { error, data } = await supabase
      .from("functional_checkups")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logToFile(`Supabase update database error: ${error.code} - ${error.message}`);
      throw error;
    }

    logToFile(`Supabase update success! Updated record ID: ${data?.id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    logToFile(`PUT catch block error: ${err.message || err}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
