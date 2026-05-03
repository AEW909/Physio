"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function archiveSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = getValue(formData, "sessionId");
  const treatmentPlanId = getValue(formData, "treatmentPlanId");

  if (!sessionId || !treatmentPlanId) {
    throw new Error("Session ID or treatment plan ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: session, error: fetchError } = await supabase
    .from("appointments")
    .select("id, is_archived")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Failed to load session before archive.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "archive_session",
    actorProfileId: user.id,
    beforeState: { is_archived: session.is_archived },
    afterState: { is_archived: true },
    entityId: sessionId,
    entityType: "session",
  });

  redirect(`/treatment-plans/${treatmentPlanId}`);
}

export async function restoreSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = getValue(formData, "sessionId");
  const treatmentPlanId = getValue(formData, "treatmentPlanId");

  if (!sessionId || !treatmentPlanId) {
    throw new Error("Session ID or treatment plan ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: session, error: fetchError } = await supabase
    .from("appointments")
    .select("id, is_archived")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Failed to load session before restore.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      is_archived: false,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "restore_session",
    actorProfileId: user.id,
    beforeState: { is_archived: session.is_archived },
    afterState: { is_archived: false },
    entityId: sessionId,
    entityType: "session",
  });

  redirect(`/treatment-plans/${treatmentPlanId}`);
}
