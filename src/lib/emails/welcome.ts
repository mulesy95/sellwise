import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function welcomeEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Welcome, ${name}.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        You're on a <strong>7-day free trial of Growth</strong> — unlimited optimisations, keyword research, and listing audits.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        First up: the setup takes 30 seconds. Pick your platforms, tell us a little about your brand voice, and we'll show you what SellWise can do.
      </p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Set up your account →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What's included in your trial
      </p>
      ${[
        "Listing Optimiser: platform-optimised titles, tags, bullets and descriptions",
        "Keyword Research: 15 keywords with volume &amp; competition data",
        "Listing Audit: a score out of 100 with a prioritised fix list",
        "Brand voice: tell SellWise how you write and it shapes every output",
        "Optimisation history: see before &amp; after scores for every listing",
      ].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top" style="padding-top:2px">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f0873b;margin-top:4px"></span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "Your 7-day trial is live — here's what to do first",
    html,
  };
}
