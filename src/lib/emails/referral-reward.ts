import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function referralRewardEmail(
  firstName: string | null,
  email: string
): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        Referral reward
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Your referral came through, ${name}.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        A seller you referred just ran their first optimisation with SellWise. We&apos;ve added <strong>7 days of Starter access</strong> to your account — unlimited keyword research, listing audits, and 50 optimisations.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Refer another seller and earn another week. Rewards stack.
      </p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Go to dashboard →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 8px;font-size:13px;color:#555555;line-height:1.5">
        Keep sharing your referral link from <a href="${appUrl}/dashboard/settings" style="color:#f0873b;text-decoration:none">Settings</a>. Every friend who runs their first optimisation earns you another 7 days.
      </p>
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "Your referral came through — you've earned 7 days free",
    html,
  };
}
