import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const { error, data } = await supabase
      .from("functional_checkups")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("API POST checkup database error:", error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API POST checkup handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { id, ...updateData } = await req.json();
    const { error, data } = await supabase
      .from("functional_checkups")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("API PUT checkup database error:", error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API PUT checkup handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
