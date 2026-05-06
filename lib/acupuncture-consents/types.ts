export type AcupunctureConsentStatus = "generated" | "submitted" | "approved" | "rejected";

export type AcupunctureConsentRecord = {
  id: string;
  patient_id: string;
  token: string;
  status: AcupunctureConsentStatus;
  requested_by: string | null;
  reviewed_by: string | null;
  patient_full_name: string | null;
  patient_date_of_birth: string | null;
  understands_treatment: boolean;
  understands_risks: boolean;
  disclosed_relevant_history: boolean;
  history_notes: string | null;
  consent_to_treatment: boolean;
  signature_name: string | null;
  clinician_review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AcupunctureConsentWithPatient = AcupunctureConsentRecord & {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};
