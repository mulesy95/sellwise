import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "50 listing optimisations per month",
    "Keyword Research",
    "Competitor Peek",
    "Listing Audit",
    "Optimisation history",
  ],
  growth: [
    "Unlimited listing optimisations",
    "Unlimited keyword research",
    "Unlimited competitor analyses",
    "Unlimited listing audits",
    "Optimisation history",
    "Priority support",
  ],
  studio: [
    "Everything in Growth",
    "Connect multiple shops",
    "Bulk listing audit",
    "Push optimised content back to your store",
    "Priority support",
  ],
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  studio: "Studio",
};

export function upgradeSuccessEmail(
  firstName: string | null,
  email: string,
  plan: string
): { subject: string; html: string } {
  const name = firstName ?? "there";
  const label = PLAN_LABELS[plan] ?? plan;
  const features = PLAN_FEATURES[plan] ?? [];

  const html = emailLayout(
    `
    <tr><td style="padding:32px 32px 20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        Subscription active
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        You're on ${label}, ${name}.
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Your SellWise ${label} subscription is now active. Everything is ready to go.
      </p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Go to dashboard →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What's included
      </p>
      ${features
        .map(
          (f) => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top">
            <span style="font-size:14px;color:#f0873b;font-weight:700">✓</span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`
        )
        .join("")}
      <p style="margin:20px 0 0;font-size:13px;color:#777777">
        Manage your billing any time from <a href="${appUrl}/dashboard/settings" style="color:#f0873b;text-decoration:none">Settings</a>.
      </p>
    </td></tr>
  `,
    accountUnsubscribeUrl(email)
  );

  return {
    subject: `You're on SellWise ${label}.`,
    html,
  };
}
