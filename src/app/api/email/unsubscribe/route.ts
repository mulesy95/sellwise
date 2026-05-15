import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  let email: string;
  try {
    email = Buffer.from(token, "base64").toString("utf-8").trim().toLowerCase();
  } catch {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: user } = await admin.auth.admin.listUsers();
  const matched = user?.users.find((u) => u.email?.toLowerCase() === email);

  if (matched) {
    await admin
      .from("profiles")
      .update({ marketing_opted_out: true })
      .eq("id", matched.id);
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed</title>
  <style>
    body { margin: 0; padding: 40px 16px; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e4e4e7; padding: 40px 32px; text-align: center; }
    .logo { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 24px; }
    .logo span { color: #f0873b; }
    h1 { font-size: 20px; font-weight: 700; color: #111; margin: 0 0 12px; }
    p { font-size: 14px; color: #555; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Sell<span>Wise</span></div>
    <h1>You're unsubscribed.</h1>
    <p>We've removed you from marketing emails. You'll still receive account and billing notifications.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
