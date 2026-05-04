import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardCounts = {
  activePatients: number;
  activeTreatmentPlans: number;
  draftNotes: number;
  archivedPatients: number;
};

export type DashboardPatientItem = {
  id: string;
  first_name: string;
  last_name: string;
  updated_at: string;
};

export type DashboardPlanItem = {
  id: string;
  title: string;
  status: "active" | "completed" | "on_hold";
  updated_at: string;
  first_session_at: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};

export type DashboardDraftNoteItem = {
  id: string;
  title: string;
  note_type: "initial_assessment" | "follow_up" | "discharge";
  updated_at: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};

export type DashboardData = {
  counts: DashboardCounts;
  recentPatients: DashboardPatientItem[];
  activePlans: DashboardPlanItem[];
  draftNotes: DashboardDraftNoteItem[];
};

export async function getDashboardData(currentUserId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  const { data: clinicianAppointments, error: clinicianAppointmentsError } = await supabase
    .from("appointments")
    .select("treatment_plan_id")
    .eq("clinician_id", currentUserId)
    .eq("is_archived", false)
    .not("treatment_plan_id", "is", null);

  if (clinicianAppointmentsError) {
    throw new Error(`Failed to load clinician caseload context: ${clinicianAppointmentsError.message}`);
  }

  const clinicianPlanIds = Array.from(
    new Set(
      ((clinicianAppointments ?? []) as Array<{ treatment_plan_id: string | null }>)
        .map((row) => row.treatment_plan_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { data: allActivePlanData, error: allActivePlanError } = clinicianPlanIds.length
    ? await supabase
        .from("treatment_plans")
        .select("id, title, status, updated_at, first_session_at, patient_id")
        .eq("is_archived", false)
        .eq("status", "active")
        .in("id", clinicianPlanIds)
    : { data: [], error: null };

  if (allActivePlanError) {
    throw new Error(`Failed to load active treatment plans: ${allActivePlanError.message}`);
  }

  const allActivePlanRows = ((allActivePlanData ?? []) as Array<{
    id: string;
    title: string;
    status: "active" | "completed" | "on_hold";
    updated_at: string;
    first_session_at: string | null;
    patient_id: string;
  }>).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const activePatientIds = Array.from(new Set(allActivePlanRows.map((row) => row.patient_id)));

  const [draftNotesResult, recentPatientsResult, notesResult] = await Promise.all([
    supabase.from("clinical_notes").select("id", { count: "exact", head: true }).eq("status", "draft").eq("created_by", currentUserId),
    activePatientIds.length
      ? supabase
          .from("patients")
          .select("id, first_name, last_name, updated_at")
          .eq("is_archived", false)
          .in("id", activePatientIds)
          .order("updated_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("clinical_notes")
      .select("id, title, note_type, updated_at, patient_id")
      .eq("status", "draft")
      .eq("created_by", currentUserId)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  if (draftNotesResult.error) {
    throw new Error(`Failed to count draft notes: ${draftNotesResult.error.message}`);
  }

  if (recentPatientsResult.error) {
    throw new Error(`Failed to load recent patients: ${recentPatientsResult.error.message}`);
  }

  if (notesResult.error) {
    throw new Error(`Failed to load draft notes: ${notesResult.error.message}`);
  }

  const planRows = allActivePlanRows.slice(0, 5);
  const noteRows = (notesResult.data ?? []) as Array<{
    id: string;
    title: string;
    note_type: "initial_assessment" | "follow_up" | "discharge";
    updated_at: string;
    patient_id: string;
  }>;

  const patientLookupIds = Array.from(new Set([...activePatientIds, ...noteRows.map((row) => row.patient_id)]));

  let patientLookup = new Map<
    string,
    {
      id: string;
      first_name: string;
      last_name: string;
    }
  >();

  if (patientLookupIds.length > 0) {
    const { data: lookupData, error: lookupError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .in("id", patientLookupIds);

    if (lookupError) {
      throw new Error(`Failed to load patient lookup for dashboard: ${lookupError.message}`);
    }

    patientLookup = new Map(
      ((lookupData ?? []) as Array<{ id: string; first_name: string; last_name: string }>).map((patient) => [
        patient.id,
        patient,
      ]),
    );
  }

  return {
    counts: {
      activePatients: activePatientIds.length,
      activeTreatmentPlans: allActivePlanRows.length,
      draftNotes: draftNotesResult.count ?? 0,
      archivedPatients: 0,
    },
    recentPatients: (recentPatientsResult.data ?? []) as DashboardPatientItem[],
    activePlans: planRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updated_at: row.updated_at,
      first_session_at: row.first_session_at,
      patient: patientLookup.get(row.patient_id) ?? null,
    })),
    draftNotes: noteRows.map((row) => ({
      id: row.id,
      title: row.title,
      note_type: row.note_type,
      updated_at: row.updated_at,
      patient: patientLookup.get(row.patient_id) ?? null,
    })),
  };
}
