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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  logToFile(`GET request received for IDPP ID: ${id}`);

  if (!id) {
    logToFile("GET request failed: Missing ID parameter");
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from("athlete_idpps")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logToFile(`Supabase GET IDPP database error: ${error.code} - ${error.message}`);
      throw error;
    }

    logToFile(`Supabase GET success for IDPP ID: ${id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    logToFile(`GET IDPP catch block error: ${err.message || err}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  logToFile("POST request received at /api/admin/idpps");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    logToFile(`POST request body parsed: athlete_id=${body.athlete_id}, coach_name=${body.coach_name}, status=${body.status}`);

    logToFile("Executing insert query in Supabase athlete_idpps...");
    const { error, data } = await supabase
      .from("athlete_idpps")
      .insert(body)
      .select()
      .single();

    if (error) {
      logToFile(`Supabase insert database error: ${error.code} - ${error.message}`);
      throw error;
    }
    
    logToFile(`Supabase insert success! New IDPP record ID: ${data?.id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    logToFile(`POST IDPP catch block error: ${err.message || err}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  logToFile("PUT request received at /api/admin/idpps");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { id, ...updateData } = await req.json();
    logToFile(`PUT request body parsed: id=${id}, athlete_id=${updateData.athlete_id}`);

    logToFile("Executing update query in Supabase athlete_idpps...");
    const { error, data } = await supabase
      .from("athlete_idpps")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logToFile(`Supabase update database error: ${error.code} - ${error.message}`);
      throw error;
    }

    logToFile(`Supabase update success! Updated IDPP record ID: ${data?.id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    logToFile(`PUT IDPP catch block error: ${err.message || err}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
