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
  const isSandbox = req.cookies.get("ebay_oauth_sandbox")?.value === "1";

  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url));
    res.cookies.delete("ebay_oauth_state");
    res.cookies.delete("ebay_oauth_sandbox");
    return res;
  };

  if (error || !code) return redirect("/dashboard/shop?error=connection_failed");
  if (!cookieState || state !== cookieState) return redirect("/dashboard/shop?error=connection_failed");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  try {
    const tokens = await exchangeEbayCode(code, isSandbox);
    const admin = createAdminClient();

    // Sandbox and production shops have distinct shop_ids so they can coexist
    const shopId = isSandbox ? `${user.id}:sandbox` : user.id;
    const shopName = isSandbox ? "eBay Sandbox Store" : "eBay Store";
    const shopUrl = isSandbox ? "sandbox.ebay.com" : "ebay.com";

    await admin.from("shops").upsert(
      {
        user_id: user.id,
        platform: "ebay",
        shop_name: shopName,
        shop_url: shopUrl,
        shop_id: shopId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        is_sandbox: isSandbox,
      },
      { onConflict: "user_id,platform,shop_id" }
    );

    return redirect("/dashboard/shop?connected=true");
  } catch (err) {
    console.error("[ebay callback]", err);
    return redirect("/dashboard/shop?error=connection_failed");
  }
}
