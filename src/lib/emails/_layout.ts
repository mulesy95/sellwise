const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";

export function accountUnsubscribeUrl(email: string): string {
  const token = Buffer.from(email.toLowerCase()).toString("base64");
  return `${appUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function emailLayout(body: string, unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">

        <!-- Header -->
        <tr><td style="padding:28px 32px 24px;border-bottom:1px solid #f4f4f5">
          <span style="font-size:20px;font-weight:700;color:#111111">Sell<span style="color:#f0873b">Wise</span></span>
        </td></tr>

        <!-- Body -->
        ${body}

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f9f9fb;border-top:1px solid #f4f4f5">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.6">
            You're receiving this because you signed up at <a href="${appUrl}" style="color:#f0873b;text-decoration:none">sellwise.au</a>.<br>
            Questions? Reply to this email and we'll help.
          </p>
          ${unsubscribeUrl ? `<p style="margin:8px 0 0;font-size:12px;color:#999999">
            <a href="${unsubscribeUrl}" style="color:#999999;text-decoration:underline">Unsubscribe</a>
          </p>` : ""}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export { appUrl };
