import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { betaInviteEmail } from "@/lib/emails/beta-invite";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function POST(req: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { firstName, email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: codeData, error: codeError } = await admin
    .from("beta_codes")
    .select("token")
    .eq("code", code)
    .single();

  if (codeError || !codeData?.token) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  const { subject, html } = betaInviteEmail(firstName ?? null, code, codeData.token);
  await sendEmail({ to: email, subject, html });

  return NextResponse.json({ success: true });
}
