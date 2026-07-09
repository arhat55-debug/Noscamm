import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (!getSupabaseServiceEnv().serviceConfigured) {
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("audit_logs").insert({
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit logging must not break user-facing flows.
  }
}
