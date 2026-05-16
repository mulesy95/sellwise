"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimReferral } from "@/lib/referral";

export type AuthState = { error: string } | null;
export type ForgotPasswordState = { error?: string; success?: boolean } | null;

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return message;
}

async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null
  );
  if (!captchaOk) return { error: "Captcha verification failed. Please try again." };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: friendlyAuthError(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null
  );
  if (!captchaOk) return { error: "Captcha verification failed. Please try again." };

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const cookieStore = await cookies();
  const betaCode = cookieStore.get("beta_access")?.value;

  if (betaCode) {
    const admin = createAdminClient();
    const { data: codeData } = await admin
      .from("beta_codes")
      .select("used_count, max_uses")
      .eq("code", betaCode)
      .single();
    if (codeData && codeData.used_count >= codeData.max_uses) {
      return { error: "This invite code has already been used. If you already have an account, log in instead." };
    }
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) return { error: friendlyAuthError(error.message) };

  if (signUpData.user) {
    const admin = createAdminClient();
    const userId = signUpData.user.id;

    // Record beta code usage
    if (betaCode) {
      await admin.from("profiles").update({ beta_code: betaCode }).eq("id", userId);
      await admin.rpc("increment_beta_code_usage", { p_code: betaCode });
    }

    // Claim referral if a ref code was passed
    const refCode = formData.get("ref_code") as string | null;
    if (refCode?.trim()) {
      void claimReferral(userId, refCode.trim()).catch(() => {});
    }
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const captchaOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null
  );
  if (!captchaOk) return { error: "Captcha verification failed. Please try again." };

  const supabase = await createClient();
  const email = formData.get("email") as string;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return { error: friendlyAuthError(error.message) };

  return { success: true };
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: friendlyAuthError(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
