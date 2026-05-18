import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(entry: {
  user_id: string;
  action: string;
  platform?: string;
  resource_id?: string;
  result: "success" | "error";
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert(entry);
  } catch (err) {
    console.error("[audit]", err);
  }
}
