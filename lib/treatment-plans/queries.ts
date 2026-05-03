import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TreatmentPlanSessionItem, TreatmentPlanSummary, TreatmentPlanWithSessions } from "@/lib/treatment-plans/types";

type AppointmentRow = {
  id: string;
  patient_id: string;
  treatment_plan_id: string | null;
  scheduled_at: string;
  appointment_type: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  location: string | null;
  clinician_id: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  clinical_notes:
    | {
        id: string;
        note_type: "initial_assessment" | "follow_up" | "discharge" | "referral";
        title: string;
        status: "draft" | "final" | "archived";
        updated_at: string;
      }[]
    | null;
};

function sortPlans(plans: TreatmentPlanSummary[]) {
  const statusRank: Record<TreatmentPlanSummary["status"], number> = {
    active: 0,
    on_hold: 1,
    completed: 2,
  };

  return [...plans].sort((a, b) => {
    const byStatus = statusRank[a.status] - statusRank[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function mapSession(row: AppointmentRow): TreatmentPlanSessionItem {
  const note = row.clinical_notes?.[0] ?? null;
  return {
    id: row.id,
    patient_id: row.patient_id,
    treatment_plan_id: row.treatment_plan_id,
    scheduled_at: row.scheduled_at,
    appointment_type: row.appointment_type,
    status: row.status,
    location: row.location,
    clinician_id: row.clinician_id,
    is_archived: row.is_archived,
    archived_at: row.archived_at,
    archived_by: row.archived_by,
    created_at: row.created_at,
    note_id: note?.id ?? null,
    note_type: note?.note_type ?? null,
    note_title: note?.title ?? null,
    note_status: note?.status ?? null,
    note_updated_at: note?.updated_at ?? null,
  };
}

export async function listTreatmentPlansForPatient(
  patientId: string,
  archiveStatus: "active" | "archived" | "all" = "active",
) {
  const supabase = await createSupabaseServerClient();
  let plansQuery = supabase
    .from("treatment_plans")
    .select(
      "id, patient_id, title, status, is_archived, archived_at, archived_by, presenting_problem_summary, goals_summary, progress_summary, overall_findings, first_session_at, completed_at, created_at, updated_at",
    )
    .eq("patient_id", patientId);

  if (archiveStatus !== "all") {
    plansQuery = plansQuery.eq("is_archived", archiveStatus === "archived");
  }

  const { data: plansData, error: plansError } = await plansQuery;

  if (plansError) {
    throw new Error(`Failed to load treatment plans: ${plansError.message}`);
  }

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, treatment_plan_id, scheduled_at, appointment_type, status, location, clinician_id, is_archived, archived_at, archived_by, created_at, clinical_notes(id, note_type, title, status, updated_at)",
    )
    .eq("patient_id", patientId)
    .not("treatment_plan_id", "is", null)
    .order("scheduled_at", { ascending: false });

  if (sessionsError) {
    throw new Error(`Failed to load treatment-plan sessions: ${sessionsError.message}`);
  }

  const sessionsByPlan = new Map<string, TreatmentPlanSessionItem[]>();
  const archivedSessionsByPlan = new Map<string, TreatmentPlanSessionItem[]>();

  ((sessionsData ?? []) as AppointmentRow[]).forEach((row) => {
    if (!row.treatment_plan_id) return;
    const mapped = mapSession(row);
    if (row.is_archived) {
      const items = archivedSessionsByPlan.get(row.treatment_plan_id) ?? [];
      items.push(mapped);
      archivedSessionsByPlan.set(row.treatment_plan_id, items);
      return;
    }

    const items = sessionsByPlan.get(row.treatment_plan_id) ?? [];
    items.push(mapped);
    sessionsByPlan.set(row.treatment_plan_id, items);
  });

  return sortPlans((plansData ?? []) as TreatmentPlanSummary[]).map((plan) => ({
    ...plan,
    sessions: sessionsByPlan.get(plan.id) ?? [],
    archived_sessions: archivedSessionsByPlan.get(plan.id) ?? [],
  })) as TreatmentPlanWithSessions[];
}

export async function getTreatmentPlan(planId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: planData, error: planError } = await supabase
    .from("treatment_plans")
    .select(
      "id, patient_id, title, status, is_archived, archived_at, archived_by, presenting_problem_summary, goals_summary, progress_summary, overall_findings, first_session_at, completed_at, created_at, updated_at",
    )
    .eq("id", planId)
    .maybeSingle();

  if (planError) {
    throw new Error(`Failed to load treatment plan: ${planError.message}`);
  }

  if (!planData) {
    notFound();
  }

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, treatment_plan_id, scheduled_at, appointment_type, status, location, clinician_id, is_archived, archived_at, archived_by, created_at, clinical_notes(id, note_type, title, status, updated_at)",
    )
    .eq("treatment_plan_id", planId)
    .order("scheduled_at", { ascending: false });

  if (sessionsError) {
    throw new Error(`Failed to load sessions for treatment plan: ${sessionsError.message}`);
  }

  const activeSessions = ((sessionsData ?? []) as AppointmentRow[]).filter((row) => !row.is_archived).map(mapSession);
  const archivedSessions = ((sessionsData ?? []) as AppointmentRow[]).filter((row) => row.is_archived).map(mapSession);

  return {
    ...(planData as TreatmentPlanSummary),
    sessions: activeSessions,
    archived_sessions: archivedSessions,
  } as TreatmentPlanWithSessions;
}
