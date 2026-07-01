import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET: Retrieve a single assessment by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: assessment, error } = await supabase
      .from("performance_assessments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    // 2. Role Check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isSelf = user.id === assessment.athlete_id;
    const isAuthorizedRole = profile?.role && ["superadmin", "staff", "coach", "medical"].includes(profile.role);

    if (!isSelf && !isAuthorizedRole) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, assessment });
  } catch (err: any) {
    console.error("Fetch Single Assessment Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing performance assessment
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get existing assessment first to verify ownership / access
    const { data: existing, error: fetchError } = await supabase
      .from("performance_assessments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // 2. Role / Edit Permissions Check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isSuperAdminOrStaff = profile?.role && ["superadmin", "staff"].includes(profile.role);
    const isOwner = existing.created_by === user.id;
    const isAuthorizedRole = profile?.role && ["coach", "medical"].includes(profile.role);

    if (!isSuperAdminOrStaff && !(isOwner && isAuthorizedRole)) {
      return NextResponse.json({ error: "Access Denied: You do not have permissions to edit this assessment" }, { status: 403 });
    }

    const body = await request.json();
    
    // Update performance_assessments
    const { data: updated, error } = await supabase
      .from("performance_assessments")
      .update({
        assessment_date: body.assessment_date,
        assessment_type: body.assessment_type,
        season: body.season,
        height_cm: body.height_cm ? parseFloat(String(body.height_cm)) : null,
        weight_kg: body.weight_kg ? parseFloat(String(body.weight_kg)) : null,
        position: body.position,
        status: body.status || 'DRAFT',
        
        // Overall Scores
        performance_score: body.performance_score !== undefined ? parseInt(String(body.performance_score)) : null,
        mobility_score: body.mobility_score !== undefined ? parseInt(String(body.mobility_score)) : null,
        symmetry_score: body.symmetry_score !== undefined ? parseInt(String(body.symmetry_score)) : null,
        risk_score: body.risk_score !== undefined ? parseInt(String(body.risk_score)) : null,
        
        // VALD Force Profile
        hamstrings_left: body.hamstrings_left ? parseFloat(String(body.hamstrings_left)) : null,
        hamstrings_right: body.hamstrings_right ? parseFloat(String(body.hamstrings_right)) : null,
        hamstrings_asymmetry: body.hamstrings_asymmetry ? parseFloat(String(body.hamstrings_asymmetry)) : null,
        hamstrings_status: body.hamstrings_status,
        
        adductors_left: body.adductors_left ? parseFloat(String(body.adductors_left)) : null,
        adductors_right: body.adductors_right ? parseFloat(String(body.adductors_right)) : null,
        adductors_asymmetry: body.adductors_asymmetry ? parseFloat(String(body.adductors_asymmetry)) : null,
        adductors_status: body.adductors_status,
        
        hip_extension_left: body.hip_extension_left ? parseFloat(String(body.hip_extension_left)) : null,
        hip_extension_right: body.hip_extension_right ? parseFloat(String(body.hip_extension_right)) : null,
        hip_extension_asymmetry: body.hip_extension_asymmetry ? parseFloat(String(body.hip_extension_asymmetry)) : null,
        hip_extension_status: body.hip_extension_status,
        
        hip_abduction_left: body.hip_abduction_left ? parseFloat(String(body.hip_abduction_left)) : null,
        hip_abduction_right: body.hip_abduction_right ? parseFloat(String(body.hip_abduction_right)) : null,
        hip_abduction_asymmetry: body.hip_abduction_asymmetry ? parseFloat(String(body.hip_abduction_asymmetry)) : null,
        hip_abduction_status: body.hip_abduction_status,
        
        hip_flexion_left: body.hip_flexion_left ? parseFloat(String(body.hip_flexion_left)) : null,
        hip_flexion_right: body.hip_flexion_right ? parseFloat(String(body.hip_flexion_right)) : null,
        hip_flexion_asymmetry: body.hip_flexion_asymmetry ? parseFloat(String(body.hip_flexion_asymmetry)) : null,
        hip_flexion_status: body.hip_flexion_status,
        
        // Functional Movement Tests
        cspine_rotation: body.cspine_rotation !== undefined ? parseInt(String(body.cspine_rotation)) : null,
        forward_bend: body.forward_bend !== undefined ? parseInt(String(body.forward_bend)) : null,
        hip_ir_left: body.hip_ir_left !== undefined ? parseInt(String(body.hip_ir_left)) : null,
        hip_er_both: body.hip_er_both !== undefined ? parseInt(String(body.hip_er_both)) : null,
        deep_squat: body.deep_squat !== undefined ? parseInt(String(body.deep_squat)) : null,
        ankle_df: body.ankle_df !== undefined ? parseInt(String(body.ankle_df)) : null,
        great_toe_ext: body.great_toe_ext !== undefined ? parseInt(String(body.great_toe_ext)) : null,
        single_leg_stand: body.single_leg_stand !== undefined ? parseInt(String(body.single_leg_stand)) : null,
        
        // Body Map
        body_map_zones: body.body_map_zones || [],
        
        // Performance Impact
        acceleration_impact: body.acceleration_impact !== undefined ? parseInt(String(body.acceleration_impact)) : null,
        sprint_impact: body.sprint_impact !== undefined ? parseInt(String(body.sprint_impact)) : null,
        change_of_direction_impact: body.change_of_direction_impact !== undefined ? parseInt(String(body.change_of_direction_impact)) : null,
        kicking_impact: body.kicking_impact !== undefined ? parseInt(String(body.kicking_impact)) : null,
        landing_impact: body.landing_impact !== undefined ? parseInt(String(body.landing_impact)) : null,
        single_leg_stability: body.single_leg_stability !== undefined ? parseInt(String(body.single_leg_stability)) : null,
        
        // Key Findings
        key_findings: body.key_findings || [],
        risk_factors: body.risk_factors || [],
        coach_summary: body.coach_summary,
        
        // Progress
        previous_assessment_id: body.previous_assessment_id || null,
        improvement_notes: body.improvement_notes,
        retest_recommended_date: body.retest_recommended_date || null,
        
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Optional: Sync back updates to profile if submitted
    if (body.status === 'SUBMITTED') {
      await supabase
        .from("profiles")
        .update({
          height: body.height_cm ? parseFloat(String(body.height_cm)) : null,
          weight: body.weight_kg ? parseFloat(String(body.weight_kg)) : null,
          position_played: body.position || null
        })
        .eq("id", existing.athlete_id);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Update Assessment Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove an assessment (admin/staff only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Role Check (Admin & Staff only)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSuperAdminOrStaff = profile?.role && ["superadmin", "staff"].includes(profile.role);
  if (!isSuperAdminOrStaff) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const { error } = await supabase
      .from("performance_assessments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete Assessment Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
