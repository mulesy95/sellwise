import { emailLayout, appUrl } from "./_layout";

export function betaInviteEmail(
  firstName: string | null,
  code: string
): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        You're invited to test SellWise
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        Hi ${name}, we're letting a small group of sellers in early to try SellWise before we launch. You're one of them.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Use the code below to create your account. It takes 30 seconds.
      </p>

      <!-- Invite code block -->
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom:28px">
        <tr><td style="background:#f9f9fb;border:1px solid #e4e4e7;border-radius:8px;padding:20px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em">
            Your invite code
          </p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#111111;letter-spacing:0.12em">
            ${code}
          </p>
        </td></tr>
      </table>

      <a href="${appUrl}"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Claim your access →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What you'll get access to
      </p>
      ${[
        "Listing Optimiser: AI-written titles, tags, and descriptions for Etsy",
        "Keyword Research: 15 keywords with volume and competition data",
        "Competitor Peek: paste a listing URL, get a better version",
        "Listing Audit: a score out of 100 with specific fixes",
      ].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top" style="padding-top:2px">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f0873b;margin-top:4px"></span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}

      <p style="margin:20px 0 0;font-size:13px;color:#888888;line-height:1.6">
        This is a beta — things may be rough around the edges. If you hit anything weird, just reply to this email and let us know.
      </p>
    </td></tr>
  `);

  return {
    subject: "You're invited to test SellWise",
    html,
  };
}
