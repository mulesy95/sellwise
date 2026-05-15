import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function trialExpiredEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Your trial has ended, ${name}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        Your free trial of SellWise Growth has ended. You're now on the Free plan: 1 optimisation per month.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Upgrade any time to get back to unlimited optimisations, keyword research, competitor analysis, and listing audits.
      </p>
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Upgrade now →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
             style="background:#f9f9fb;border-radius:8px;border:1px solid #e4e4e7;padding:20px">
        <tr><td>
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111111">Plans from $19/mo</p>
          ${[["Starter", "$19/mo", "50 optimisations + all features"], ["Growth", "$29/mo", "Unlimited everything"], ["Studio", "$79/mo", "Multi-shop + platform API"]].map(([plan, price, desc]) => `
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px" role="presentation">
            <tr>
              <td style="font-size:13px;font-weight:600;color:#111111;width:70px">${plan}</td>
              <td style="font-size:13px;color:#f0873b;font-weight:700;width:70px">${price}</td>
              <td style="font-size:13px;color:#555555">${desc}</td>
            </tr>
          </table>`).join("")}
          <a href="${appUrl}/pricing"
             style="display:inline-block;margin-top:8px;font-size:13px;color:#f0873b;text-decoration:none;font-weight:600">
            See full pricing →
          </a>
        </td></tr>
      </table>
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "Your SellWise trial has ended",
    html,
  };
}
