import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authentication Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Role Authorization Check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const allowedRoles = ["superadmin", "admin", "staff", "coach"];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden. Insufficient permissions." }, { status: 403 });
    }

    let count = 0;
    let tableExists = true;

    // 3. Rate Limit Check (Max 10 downloads per user per 24h rolling window)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dbCount, error: countError } = await supabase
      .from("document_downloads_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("downloaded_at", twentyFourHoursAgo);

    if (countError) {
      if (countError.code === "42P01") { // postgres table does not exist error
        tableExists = false;
        console.warn(
          "Table 'document_downloads_log' does not exist. Rate limiting and DB logging bypassed. Please run migration: 20260701000000_document_downloads_log.sql"
        );
      } else {
        console.error("Error checking rate limit count:", countError);
      }
    } else {
      count = dbCount || 0;
    }

    if (tableExists && count >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 downloads per day." },
        { status: 429 }
      );
    }

    // 4. Log Download
    if (tableExists) {
      const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";

      const { error: logError } = await supabase
        .from("document_downloads_log")
        .insert({
          user_id: user.id,
          document_name: "KioX_GG_Sum26.pdf",
          ip_address: ipAddress
        });

      if (logError) {
        console.error("Error logging download to database:", logError);
      }
    }

    // 5. Serve File Securely
    const filePath = path.join(process.cwd(), "private/doc/KioX_GG_Sum26.pdf");

    if (!fs.existsSync(filePath)) {
      console.error("File not found on server path:", filePath);
      return NextResponse.json({ error: "Document file not found on server." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = "KioX_GG_Sum26.pdf";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString()
      }
    });

  } catch (err: any) {
    console.error("Error in secure download API route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
