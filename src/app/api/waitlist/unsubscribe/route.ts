import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const decoded = Buffer.from(email, "base64").toString("utf-8").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded)) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("waitlist").delete().eq("email", decoded);

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
    <p>We've removed your email from the waitlist. You won't hear from us again.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
