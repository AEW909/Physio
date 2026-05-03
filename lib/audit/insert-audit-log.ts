import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function insertAuditLog(entry: {
  action: string;
  actorProfileId: string;
  afterState: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  entityId: string;
  entityType: string;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from("audit_log").insert({
    actor_profile_id: entry.actorProfileId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before_state: entry.beforeState ?? null,
    after_state: entry.afterState,
  });
}
