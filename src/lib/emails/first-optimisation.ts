import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function firstOptimisationEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        First one done
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Nice work, ${name}!
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        You just ran your first optimisation. Copy that title and tags straight into your listing and you're done.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        A few things worth knowing while your trial is active:
      </p>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      ${[
        ["Keyword Research", "Find 15 keywords with real volume and competition data. Useful before you write a listing from scratch.", "/dashboard/keywords"],
        ["Competitor Peek", "Paste any listing URL and get an AI-optimised version of it. Good for seeing what top sellers are doing.", "/dashboard/competitor"],
        ["Listing Audit", "Score an existing listing out of 100 and get specific fixes. Run it on your best sellers first.", "/dashboard/audit"],
      ].map(([title, desc, path]) => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;background:#f9f9fb;border-radius:8px;border:1px solid #e4e4e7" role="presentation">
        <tr><td style="padding:16px 20px">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111111">${title}</p>
          <p style="margin:0 0 10px;font-size:13px;color:#555555;line-height:1.5">${desc}</p>
          <a href="${appUrl}${path}" style="font-size:13px;color:#f0873b;text-decoration:none;font-weight:600">Try it →</a>
        </td></tr>
      </table>`).join("")}
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "Your first SellWise optimisation is done",
    html,
  };
}
