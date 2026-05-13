import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const data = await getUsageData(user.id);
  return NextResponse.json(data);
}
