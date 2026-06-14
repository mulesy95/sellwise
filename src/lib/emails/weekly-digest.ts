export function weeklyDigestEmail(
  firstName: string | null,
  stats: { optimisationCount: number; topScore: number }
): { subject: string; html: string } {
  const name = firstName ?? "there";
  const subject = `Your SellWise week: ${stats.optimisationCount} listing${stats.optimisationCount !== 1 ? "s" : ""} improved`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
  <p style="font-size: 22px; font-weight: 700; margin: 0 0 4px;">SellWise</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0 24px;">

  <p style="font-size: 15px; margin: 0 0 20px;">Hi ${name},</p>

  <p style="font-size: 15px; margin: 0 0 20px;">
    Last week you improved <strong>${stats.optimisationCount} listing${stats.optimisationCount !== 1 ? "s" : ""}</strong>.
    Your best score was <strong>${stats.topScore}/100</strong>.
  </p>

  <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
    <tr>
      <td style="padding-right: 24px; text-align: center;">
        <p style="font-size: 36px; font-weight: 700; margin: 0; color: #111;">${stats.optimisationCount}</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">listings improved</p>
      </td>
      <td style="padding-right: 24px; color: #ccc; font-size: 24px;">|</td>
      <td style="text-align: center;">
        <p style="font-size: 36px; font-weight: 700; margin: 0; color: ${stats.topScore >= 80 ? "#10b981" : stats.topScore >= 60 ? "#f59e0b" : "#ef4444"};">${stats.topScore}</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">best score</p>
      </td>
    </tr>
  </table>

  <a href="https://sellwise.au/dashboard/optimise" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 28px;">
    Keep going
  </a>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;">
  <p style="font-size: 12px; color: #999; margin: 0;">
    You&apos;re getting this because you have an active SellWise account.
    <a href="https://sellwise.au/api/email/unsubscribe?email={{email}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>
  `.trim();

  return { subject, html };
}
