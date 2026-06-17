import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function trialDay3Email(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const tools = [
    {
      label: "Keyword Research",
      desc: "Find 15 marketplace keywords ranked by volume and competition — paste the best ones straight into your optimiser.",
      href: `${appUrl}/dashboard/keywords`,
      cta: "Research keywords →",
    },
    {
      label: "Listing Audit",
      desc: "Paste an existing listing and get a score out of 100 with a prioritised fix list. Takes 30 seconds.",
      href: `${appUrl}/dashboard/audit`,
      cta: "Audit a listing →",
    },
    {
      label: "Connect your store",
      desc: "Link your Shopify or eBay store and see SEO scores across every listing — no copy-paste needed.",
      href: `${appUrl}/dashboard/shop`,
      cta: "Connect store →",
    },
  ];

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 8px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        Day 3 of 7
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        You've got 4 days left — here's what to try next
      </h1>
      <p style="margin:0 0 0;font-size:15px;color:#444444;line-height:1.6">
        Most sellers only use the optimiser. The tools below are where SellWise gets interesting, ${name}.
      </p>
    </td></tr>

    ${tools.map((t) => `
    <tr><td style="padding:20px 32px 0">
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
             style="background:#f9f9fb;border:1px solid #e4e4e7;border-radius:8px;padding:16px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#111111">${t.label}</p>
          <p style="margin:0 0 10px;font-size:13px;color:#555555;line-height:1.55">${t.desc}</p>
          <a href="${t.href}" style="font-size:13px;font-weight:600;color:#f0873b;text-decoration:none">${t.cta}</a>
        </td></tr>
      </table>
    </td></tr>`).join("")}

    <tr><td style="padding:24px 32px 32px">
      <p style="margin:0;font-size:13px;color:#777777;line-height:1.6">
        Your trial ends in 4 days. After that, keyword research, audits, and store connect require a paid plan.<br>
        <a href="${appUrl}/pricing" style="color:#f0873b;text-decoration:none">See pricing →</a>
      </p>
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: `4 days left — have you tried keyword research yet, ${name}?`,
    html,
  };
}
