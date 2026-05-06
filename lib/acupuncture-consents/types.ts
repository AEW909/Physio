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
  diabetes_response: "yes" | "no" | null;
  epileptic_seizure_response: "yes" | "no" | null;
  fainted_response: "yes" | "no" | null;
  heart_problem_response: "yes" | "no" | null;
  pacemaker_response: "yes" | "no" | null;
  circulation_problem_response: "yes" | "no" | null;
  anticoagulation_response: "yes" | "no" | null;
  cancer_response: "yes" | "no" | null;
  blood_borne_virus_response: "yes" | "no" | null;
  allergy_response: "yes" | "no" | null;
  pregnant_response: "yes" | "no" | null;
  needle_phobia_response: "yes" | "no" | null;
  prior_needling_adverse_effect_response: "yes" | "no" | null;
  eaten_within_two_hours_response: "yes" | "no" | null;
  screening_notes: string | null;
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
