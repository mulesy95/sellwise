import { emailLayout, appUrl } from "./_layout";

export function waitlistConfirmationEmail(email: string): { subject: string; html: string } {
  const token = Buffer.from(email).toString("base64");
  const unsubscribeUrl = `${appUrl}/api/waitlist/unsubscribe?email=${encodeURIComponent(token)}`;

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        You're on the list.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        We'll send you an email the moment SellWise is open. You'll be first to know.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        SellWise is an AI co-pilot for online sellers. It writes optimised titles, tags, and descriptions for Etsy, Shopify, and Amazon. Done in under 10 seconds.
      </p>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What's coming
      </p>
      ${["AI-optimised listings for Etsy, Shopify &amp; Amazon", "Keyword research with volume and competition data", "Competitor analysis: see how your listings stack up", "Listing audit: a score out of 100 with fixes you can act on"].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top" style="padding-top:2px">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f0873b;margin-top:4px"></span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}
    </td></tr>
  `, unsubscribeUrl);

  return {
    subject: "You're on the SellWise waitlist",
    html,
  };
}
