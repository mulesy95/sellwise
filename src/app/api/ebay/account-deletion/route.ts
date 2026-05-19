import { createHash, createHmac } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFICATION_TOKEN = process.env.EBAY_DELETION_VERIFICATION_TOKEN!;
const ENDPOINT_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/ebay/account-deletion`;

// eBay challenge handshake — called when you register the endpoint in the developer portal
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get("challenge_code");

  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  // eBay spec: SHA256(challengeCode + verificationToken + endpointUrl)
  const hash = createHash("sha256")
    .update(challengeCode)
    .update(VERIFICATION_TOKEN)
    .update(ENDPOINT_URL)
    .digest("hex");

  return NextResponse.json({ challengeResponse: hash });
}

// eBay account deletion notification — called when an eBay user deletes their account
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      notification?: {
        data?: {
          username?: string;
          userId?: string;
          eiasToken?: string;
        };
      };
    };

    const userId = body?.notification?.data?.userId;
    const username = body?.notification?.data?.username;

    if (userId || username) {
      const admin = createAdminClient();
      // Delete any shop records tied to this eBay account
      // We match on shop_id (eBay user ID) or shop_name (username)
      const conditions = [];
      if (userId) conditions.push(`shop_id.eq.${userId}`);
      if (username) conditions.push(`shop_name.eq.${username}`);

      await admin
        .from("shops")
        .delete()
        .eq("platform", "ebay")
        .or(conditions.join(","));
    }

    return NextResponse.json({ acknowledged: true });
  } catch {
    // Always return 200 — eBay retries on non-2xx and we don't want a loop
    return NextResponse.json({ acknowledged: true });
  }
}
