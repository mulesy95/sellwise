import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function trialNudgeEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        2 days left
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Your free trial ends soon, ${name}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        Your 7-day Growth trial ends in 2 days. After that you'll drop to the Free plan: 1 optimisation per month, no keyword research, no competitor analysis, no audits.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Upgrade now to keep everything running without interruption.
      </p>
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Upgrade to keep access →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What you'll keep with Growth at $29/mo
      </p>
      ${["Unlimited listing optimisations", "Unlimited keyword research", "Unlimited competitor analyses", "Unlimited listing audits", "Optimisation history", "Priority support"].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top">
            <span style="font-size:14px;color:#f0873b;font-weight:700">✓</span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}
      <p style="margin:16px 0 0;font-size:13px;color:#777777">
        Or try <a href="${appUrl}/pricing" style="color:#f0873b;text-decoration:none">Starter at $19/mo</a>. 50 optimisations plus all features.
      </p>
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "2 days left on your SellWise trial",
    html,
  };
}
