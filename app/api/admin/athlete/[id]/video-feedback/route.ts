import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const athleteId = params.id;
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
    const fileName = `${athleteId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("feedback_videos")
      .upload(fileName, videoFile, {
        contentType: videoFile.type,
        upsert: true
      });

    if (uploadError) return NextResponse.json({ error: `Storage Error: ${uploadError.message}` }, { status: 500 });

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
  const { data, error } = await supabase
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}
