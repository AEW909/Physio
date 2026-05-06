import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AcupunctureConsentRecord,
  AcupunctureConsentStatus,
  AcupunctureConsentWithPatient,
} from "@/lib/acupuncture-consents/types";

const CONSENT_SELECT = `
  id,
  patient_id,
  token,
  status,
  requested_by,
  reviewed_by,
  patient_full_name,
  patient_date_of_birth,
  understands_treatment,
  understands_risks,
  disclosed_relevant_history,
  history_notes,
  consent_to_treatment,
  signature_name,
  diabetes_response,
  epileptic_seizure_response,
  fainted_response,
  heart_problem_response,
  pacemaker_response,
  circulation_problem_response,
  anticoagulation_response,
  cancer_response,
  blood_borne_virus_response,
  allergy_response,
  pregnant_response,
  needle_phobia_response,
  prior_needling_adverse_effect_response,
  eaten_within_two_hours_response,
  screening_notes,
  clinician_review_notes,
  submitted_at,
  reviewed_at,
  created_at,
  updated_at
`;

function normalisePatient<T extends { patient: unknown }>(row: T) {
  const patient = Array.isArray(row.patient) ? row.patient[0] ?? null : row.patient;
  return {
    ...row,
    patient,
  };
}

export function getAcupunctureConsentStatusLabel(status: AcupunctureConsentStatus) {
  switch (status) {
    case "generated":
      return "Awaiting patient";
    case "submitted":
      return "Awaiting clinician review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export async function listAcupunctureConsentsForPatient(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("acupuncture_consents")
    .select(CONSENT_SELECT)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load acupuncture consents: ${error.message}`);
  }

  return (data ?? []) as AcupunctureConsentRecord[];
}

export async function getAcupunctureConsentByToken(token: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("acupuncture_consents")
    .select(
      `${CONSENT_SELECT},
      patient:patients (
        id,
        first_name,
        last_name,
        date_of_birth
      )`,
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load acupuncture consent from token: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return normalisePatient(data as typeof data & { patient: unknown }) as AcupunctureConsentRecord & {
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      date_of_birth: string | null;
    } | null;
  };
}

export async function listOutstandingAcupunctureConsents(patientIds?: string[]) {
  if (patientIds && patientIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("acupuncture_consents")
    .select(
      `${CONSENT_SELECT},
      patient:patients (
        id,
        first_name,
        last_name
      )`,
    )
    .in("status", ["generated", "submitted"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (patientIds?.length) {
    query = query.in("patient_id", patientIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load outstanding acupuncture consents: ${error.message}`);
  }

  return ((data ?? []) as Array<(AcupunctureConsentRecord & { patient: unknown })>).map((row) =>
    normalisePatient(row),
  ) as AcupunctureConsentWithPatient[];
}
