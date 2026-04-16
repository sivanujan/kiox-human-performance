import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role Check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  // 3. Process Multi-part Data
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const notes = formData.get("notes") as string;
  const uploadMethod = formData.get("uploadMethod") as string;
  
  let finalVideoUrl = "";

  if (uploadMethod === "file") {
    const videoFile = formData.get("video") as File;
    if (!videoFile) return NextResponse.json({ error: "No video file provided" }, { status: 400 });

    const fileExt = videoFile.name.split(".").pop();
    // Path: athlete-id/timestamp-random.ext
    const fileName = `${athleteId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("feedback_videos")
      .upload(fileName, videoFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: `Storage Error: ${uploadError.message}` }, { status: 500 });
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("feedback_videos")
      .getPublicUrl(fileName);

    finalVideoUrl = publicUrl;
  } else {
    finalVideoUrl = formData.get("videoUrl") as string;
  }

  if (!finalVideoUrl) return NextResponse.json({ error: "No video source provided" }, { status: 400 });

  // 4. Insert Video Feedback Record
  console.log("Committing to DB:", { athlete_id: athleteId, title, finalVideoUrl, uploaded_by: user.id });
  
  const { data, error: dbError } = await supabase
    .from("athlete_video_feedback")
    .insert({
      athlete_id: athleteId,
      title,
      category,
      notes,
      video_url: finalVideoUrl,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (dbError) {
    console.error("Database Insertion Error:", dbError);
    return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
  }

  // --- TRIGGER PUSH NOTIFICATION TO ATHLETE ---
  const { error: notifyError } = await supabase
    .from("system_notifications")
    .insert({
      recipient_id: athleteId,
      sender_id: user.id,
      title: "NEW TACTICAL CLIP",
      message: `${profile.first_name || 'A Coach'} uploaded video feedback: ${title}`,
      type: "UPDATE"
    });

  if (notifyError) {
    console.warn("Failed to trigger push notification, but video was saved:", notifyError);
  }

  console.log("Success! Record created:", data.id);
  return NextResponse.json({ success: true, data });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Fetch History
  // Only Admin/Staff or the Athlete themselves should see this
  
  // DIAGNOSTIC CHECK: Verify table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from("athlete_video_feedback")
    .select("id")
    .limit(1);

  if (tableError) {
    console.error("Diagnostic Table Check Failed:", tableError);
    if (tableError.code === '42P01') {
      return NextResponse.json({ error: "Table 'athlete_video_feedback' does not exist. Please run the setup SQL." }, { status: 404 });
    }
    return NextResponse.json({ error: tableError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("athlete_video_feedback")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: athleteId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role Check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: "No video ID provided" }, { status: 400 });
  }

  // 3. Delete from database
  const { error } = await supabase
    .from("athlete_video_feedback")
    .delete()
    .eq("id", videoId)
    .eq("athlete_id", athleteId);

  if (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // NOTE: If we wanted to delete from storage bucket too, we could parse the video_url 
  // and run supabase.storage.from("feedback_videos").remove([fileName]).
  // For now, removing the database record strictly removes it from the UI.

  return NextResponse.json({ success: true });
}
