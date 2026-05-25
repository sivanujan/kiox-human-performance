import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { childId, otp } = await req.json();

    if (!childId || !otp) {
      return NextResponse.json({ error: "Missing child ID or verification code." }, { status: 400 });
    }

    // Initialize Supabase with service role key to securely query/update profiles
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the OTP data from the child's profile
    const { data: profile, error: selectError } = await supabase
      .from("profiles")
      .select("linking_otp, linking_otp_expires_at")
      .eq("id", childId)
      .single();

    if (selectError || !profile) {
      return NextResponse.json({ error: "Linked Player record not found." }, { status: 404 });
    }

    const { linking_otp, linking_otp_expires_at } = profile;

    // Check if OTP matches and is not expired
    if (!linking_otp || !linking_otp_expires_at) {
      return NextResponse.json({ error: "No active verification code found for this player. Please request a new one." }, { status: 400 });
    }

    const now = new Date();
    const expiry = new Date(linking_otp_expires_at);

    if (now > expiry) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    if (linking_otp.trim() !== otp.trim()) {
      return NextResponse.json({ error: "Invalid verification code. Please check and try again." }, { status: 400 });
    }

    // Clear the OTP columns upon successful verification
    const { error: clearError } = await supabase
      .from("profiles")
      .update({
        linking_otp: null,
        linking_otp_expires_at: null
      })
      .eq("id", childId);

    if (clearError) {
      console.error("Failed to clear OTP columns:", clearError);
      // Proceed anyway as the validation itself passed
    }

    return NextResponse.json({
      success: true,
      message: "Player account verified and authorized for linking."
    });
  } catch (err: any) {
    console.error("OTP verification exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
