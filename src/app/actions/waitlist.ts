"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { waitlistConfirmationEmail } from "@/lib/emails/waitlist-confirmation";

export type WaitlistState = { success?: boolean; error?: string } | null;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") return { success: true }; // already on list
    console.error("[waitlist]", error.code, error.message);
    return { error: "Something went wrong. Please try again." };
  }

  const { subject, html } = waitlistConfirmationEmail();
  void sendEmail({ to: email, subject, html });

  return { success: true };
}
