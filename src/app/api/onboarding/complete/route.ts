import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let categories: string[] = [];
  let platforms: string[] = [];

  try {
    const body = await req.json();
    categories = Array.isArray(body.categories) ? body.categories : [];
    platforms = Array.isArray(body.platforms) ? body.platforms : [];
  } catch {
    // no body — skip was pressed
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      onboarding_completed: true,
      ...(categories.length > 0 && { onboarding_categories: categories }),
      ...(platforms.length > 0 && { onboarding_platforms: platforms }),
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
