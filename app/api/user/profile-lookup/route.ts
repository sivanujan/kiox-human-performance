import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const idsParam = searchParams.get("ids");

    if (!idParam && !idsParam) {
      return NextResponse.json({ error: "Missing id or ids parameter" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user session
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Initialize service role client to bypass RLS
    const serviceClient = createServiceClient();

    // Fetch the logged-in user's profile to check their role and relationships
    const { data: currentUserProfile, error: profileErr } = await serviceClient
      .from("profiles")
      .select("id, role, parent_of, assigned_staff")
      .eq("id", user.id)
      .single();

    if (profileErr || !currentUserProfile) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 403 });
    }

    // Parse requested IDs
    const targetIds: string[] = [];
    if (idParam) {
      targetIds.push(idParam);
    }
    if (idsParam) {
      idsParam.split(",").forEach(id => {
        const trimmed = id.trim();
        if (trimmed && !targetIds.includes(trimmed)) {
          targetIds.push(trimmed);
        }
      });
    }

    // 3. Security Relationship Validation
    const isStaffOrAdmin = ["staff", "superadmin", "medical"].includes(currentUserProfile.role);
    
    // Resolve relationship allowed list
    const allowedIds = new Set<string>();
    allowedIds.add(user.id); // Can always view own profile

    if (currentUserProfile.role === "parent") {
      // Parent can view their child
      if (currentUserProfile.parent_of) {
        allowedIds.add(currentUserProfile.parent_of);
        
        // Parent can view their child's coach
        const { data: childProfile } = await serviceClient
          .from("profiles")
          .select("assigned_staff")
          .eq("id", currentUserProfile.parent_of)
          .single();
          
        if (childProfile?.assigned_staff) {
          allowedIds.add(childProfile.assigned_staff);
        }
      }
    } else if (currentUserProfile.role === "athlete") {
      // Athlete can view their coach
      if (currentUserProfile.assigned_staff) {
        allowedIds.add(currentUserProfile.assigned_staff);
      }
      
      // Athlete can view their parent (if any is linked)
      const { data: parentProfile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("role", "parent")
        .eq("parent_of", user.id)
        .maybeSingle();
        
      if (parentProfile) {
        allowedIds.add(parentProfile.id);
      }
    }

    // Filter requested IDs based on permissions
    const authorizedIds = targetIds.filter(targetId => {
      return isStaffOrAdmin || allowedIds.has(targetId);
    });

    if (authorizedIds.length === 0) {
      return NextResponse.json({ error: "Forbidden: No legitimate relationship exists to fetch these profiles" }, { status: 403 });
    }

    // 4. Fetch Profiles
    const { data: profiles, error: fetchErr } = await serviceClient
      .from("profiles")
      .select("id, first_name, last_name, username, role, avatar_url, assigned_staff, parent_of, training_status, injury_risk")
      .in("id", authorizedIds);

    if (fetchErr || !profiles) {
      return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 });
    }

    // If single ID requested, return single object or error if not found
    if (idParam && !idsParam) {
      const match = profiles.find(p => p.id === idParam);
      if (!match) {
        return NextResponse.json({ error: "Profile not found or access denied" }, { status: 404 });
      }
      return NextResponse.json(match);
    }

    return NextResponse.json(profiles);
  } catch (err) {
    console.error("Profile Lookup API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
