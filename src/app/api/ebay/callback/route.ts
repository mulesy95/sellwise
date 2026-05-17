import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeEbayCode } from "@/lib/ebay";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieState = req.cookies.get("ebay_oauth_state")?.value;
  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url));
    res.cookies.delete("ebay_oauth_state");
    return res;
  };

  if (error || !code) return redirect("/dashboard/shop?error=connection_failed");
  if (!cookieState || state !== cookieState) return redirect("/dashboard/shop?error=connection_failed");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  try {
    const tokens = await exchangeEbayCode(code);
    const admin = createAdminClient();

    // Store in shops table — shop_name defaults to "eBay Store" until we can fetch it
    await admin.from("shops").upsert(
      {
        user_id: user.id,
        platform: "ebay",
        shop_name: "eBay Store",
        shop_url: "ebay.com",
        shop_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
      { onConflict: "user_id,platform,shop_id" }
    );

    return redirect("/dashboard/shop?connected=true");
  } catch (err) {
    console.error("[ebay callback]", err);
    return redirect("/dashboard/shop?error=connection_failed");
  }
}
