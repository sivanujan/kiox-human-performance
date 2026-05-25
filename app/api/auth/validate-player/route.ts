import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendParentLinkingOtpEmail } from "@/lib/email";

function obfuscateEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${"*".repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Initialize Supabase with the service role key to query profiles and auth.users safely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let player = null;

    // 1. Try to find by UUID (Player ID)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(query);
    if (isUuid) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, username, role")
        .eq("id", query)
        .eq("role", "athlete")
        .maybeSingle();

      if (!error && data) {
        player = data;
      }
    }

    // 2. Try to find by Username (case-insensitive)
    if (!player) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, username, role")
        .ilike("username", query)
        .eq("role", "athlete")
        .maybeSingle();

      if (!error && data) {
        player = data;
      }
    }

    // 3. Try to find by email in auth.users via Admin Auth API
    if (!player) {
      // List users to find the email
      const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authUsersData?.users) {
        const matchedUser = authUsersData.users.find(
          (u) => u.email?.toLowerCase() === query.toLowerCase()
        );

        if (matchedUser) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, username, role")
            .eq("id", matchedUser.id)
            .eq("role", "athlete")
            .maybeSingle();

          if (!error && data) {
            player = data;
          }
        }
      }
    }

    if (!player) {
      return NextResponse.json(
        { error: "Active Player not found. Verify their email, username, or Player ID." },
        { status: 404 }
      );
    }

    const name = player.first_name 
      ? `${player.first_name} ${player.last_name || ""}`.trim() 
      : player.username || "Player";

    // --- PARENT LINKING SECURITY EXTENSION (OTP) ---
    // 1. Fetch child's email address from auth.users
    let childEmail = "";
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(player.id);
    if (!userError && userData?.user?.email) {
      childEmail = userData.user.email;
    } else {
      // Fallback: if we matched by query email and listUsers succeeded
      if (query.includes("@")) {
        childEmail = query;
      }
    }

    if (!childEmail) {
      return NextResponse.json(
        { error: "Could not retrieve the player's contact email. Please ensure their account is fully active." },
        { status: 400 }
      );
    }

    // 2. Generate secure 6-digit OTP passcode
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 3. Save OTP inside child's public.profiles row
    const { error: otpUpdateError } = await supabase
      .from("profiles")
      .update({
        linking_otp: otp,
        linking_otp_expires_at: expiresAt
      })
      .eq("id", player.id);

    if (otpUpdateError) {
      console.error("Failed to store OTP in child profile:", otpUpdateError);
      return NextResponse.json({ error: "Database linking sync failed. Please try again." }, { status: 500 });
    }

    // 4. Dispatch Email to Child containing the OTP
    try {
      await sendParentLinkingOtpEmail(childEmail, name, otp);
      console.log(`[PARENT LINKING] Secure OTP successfully emailed to child: ${obfuscateEmail(childEmail)}`);
    } catch (emailErr) {
      console.error("Nodemailer OTP dispatch failed:", emailErr);
      return NextResponse.json({ error: "Failed to dispatch verification email to child's inbox." }, { status: 500 });
    }

    return NextResponse.json({
      id: player.id,
      name,
      username: player.username,
      emailSentTo: obfuscateEmail(childEmail)
    });
  } catch (err: any) {
    console.error("Player validation exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
