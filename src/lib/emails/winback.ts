import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function winbackEmail(
  firstName: string | null,
  email: string
): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(
    `
    <tr><td style="padding:32px 32px 28px">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Quick question, ${name}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        You cancelled your SellWise subscription a week ago. We wanted to check in: was there something we could have done better?
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        If you ran into a problem or it just wasn't the right fit, we'd genuinely love to know. Reply to this email and we'll read it.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        And if you ever want to come back, your history is still here.
      </p>
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        View plans →
      </a>
    </td></tr>
  `,
    accountUnsubscribeUrl(email)
  );

  return {
    subject: "Quick question about your SellWise account",
    html,
  };
}
