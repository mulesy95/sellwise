import { emailLayout, accountUnsubscribeUrl, appUrl } from "./_layout";

export function subscriptionCancelledEmail(
  firstName: string | null,
  email: string
): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(
    `
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Your subscription has been cancelled, ${name}.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        You're now on the Free plan: 1 optimisation per month. Your data and history are still here whenever you come back.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        If you cancelled by mistake or want to resubscribe, you can do that any time.
      </p>
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        View plans →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0;font-size:13px;color:#777777;line-height:1.6">
        Questions about your cancellation? Reply to this email and we'll help.
      </p>
    </td></tr>
  `,
    accountUnsubscribeUrl(email)
  );

  return {
    subject: "Your SellWise subscription has been cancelled.",
    html,
  };
}
