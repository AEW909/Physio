"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AcupunctureConsentSubmitState = {
  error?: string;
  success?: string;
};

const yesNoEnum = z.enum(["yes", "no"], {
  errorMap: () => ({ message: "Please answer all of the health screening questions." }),
});

const consentSubmissionSchema = z.object({
  token: z.string().min(20, "Consent token is missing."),
  patientFullName: z.string().trim().min(1, "Enter your full name."),
  patientDateOfBirth: z.string().trim().min(1, "Enter your date of birth."),
  understandsTreatment: z.literal("on", {
    errorMap: () => ({ message: "Please confirm that the treatment has been explained." }),
  }),
  understandsRisks: z.literal("on", {
    errorMap: () => ({ message: "Please confirm that you understand the common risks and effects." }),
  }),
  disclosedRelevantHistory: z.literal("on", {
    errorMap: () => ({ message: "Please confirm that you have disclosed relevant medical history." }),
  }),
  historyNotes: z.string().trim().optional(),
  consentToTreatment: z.literal("on", {
    errorMap: () => ({ message: "Please confirm your consent to acupuncture treatment." }),
  }),
  diabetesResponse: yesNoEnum,
  epilepticSeizureResponse: yesNoEnum,
  faintedResponse: yesNoEnum,
  heartProblemResponse: yesNoEnum,
  pacemakerResponse: yesNoEnum,
  circulationProblemResponse: yesNoEnum,
  anticoagulationResponse: yesNoEnum,
  cancerResponse: yesNoEnum,
  bloodBorneVirusResponse: yesNoEnum,
  allergyResponse: yesNoEnum,
  pregnantResponse: yesNoEnum,
  needlePhobiaResponse: yesNoEnum,
  priorNeedlingAdverseEffectResponse: yesNoEnum,
  eatenWithinTwoHoursResponse: yesNoEnum,
  screeningNotes: z.string().trim().optional(),
  signatureName: z.string().trim().min(1, "Enter your typed signature."),
});

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on" ? "on" : "";
}

export async function createAcupunctureConsentRequestAction(formData: FormData) {
  const profile = await requireRole(["owner", "clinician", "admin"]);
  const patientId = getValue(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const token = randomBytes(24).toString("hex");

  const { data, error } = await supabase
    .from("acupuncture_consents")
    .insert({
      patient_id: patientId,
      token,
      status: "generated",
      requested_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to generate the acupuncture consent link.");
  }

  await insertAuditLog({
    action: "create_acupuncture_consent_request",
    actorProfileId: profile.id,
    entityId: data.id,
    entityType: "acupuncture_consent",
    afterState: {
      patient_id: patientId,
      status: "generated",
    },
  });

  redirect(`/patients/${patientId}`);
}

export async function submitAcupunctureConsentAction(
  _prevState: AcupunctureConsentSubmitState,
  formData: FormData,
): Promise<AcupunctureConsentSubmitState> {
  const parsed = consentSubmissionSchema.safeParse({
    token: getValue(formData, "token"),
    patientFullName: getValue(formData, "patientFullName"),
    patientDateOfBirth: getValue(formData, "patientDateOfBirth"),
    understandsTreatment: getCheckboxValue(formData, "understandsTreatment"),
    understandsRisks: getCheckboxValue(formData, "understandsRisks"),
    disclosedRelevantHistory: getCheckboxValue(formData, "disclosedRelevantHistory"),
    historyNotes: getValue(formData, "historyNotes"),
    consentToTreatment: getCheckboxValue(formData, "consentToTreatment"),
    diabetesResponse: getValue(formData, "diabetesResponse"),
    epilepticSeizureResponse: getValue(formData, "epilepticSeizureResponse"),
    faintedResponse: getValue(formData, "faintedResponse"),
    heartProblemResponse: getValue(formData, "heartProblemResponse"),
    pacemakerResponse: getValue(formData, "pacemakerResponse"),
    circulationProblemResponse: getValue(formData, "circulationProblemResponse"),
    anticoagulationResponse: getValue(formData, "anticoagulationResponse"),
    cancerResponse: getValue(formData, "cancerResponse"),
    bloodBorneVirusResponse: getValue(formData, "bloodBorneVirusResponse"),
    allergyResponse: getValue(formData, "allergyResponse"),
    pregnantResponse: getValue(formData, "pregnantResponse"),
    needlePhobiaResponse: getValue(formData, "needlePhobiaResponse"),
    priorNeedlingAdverseEffectResponse: getValue(formData, "priorNeedlingAdverseEffectResponse"),
    eatenWithinTwoHoursResponse: getValue(formData, "eatenWithinTwoHoursResponse"),
    screeningNotes: getValue(formData, "screeningNotes"),
    signatureName: getValue(formData, "signatureName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please complete the required consent fields.",
    };
  }

  const admin = createSupabaseAdminClient();
  const token = parsed.data.token;
  const { data: consent, error: fetchError } = await admin
    .from("acupuncture_consents")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !consent) {
    return {
      error: fetchError?.message ?? "This consent link could not be found.",
    };
  }

  if (consent.status !== "generated") {
    return {
      error:
        consent.status === "submitted"
          ? "This consent form has already been submitted and is awaiting review."
          : "This consent link is no longer active. Please contact the clinic for a fresh link.",
    };
  }

  const { error } = await admin
    .from("acupuncture_consents")
    .update({
      patient_full_name: parsed.data.patientFullName,
      patient_date_of_birth: parsed.data.patientDateOfBirth,
      understands_treatment: true,
      understands_risks: true,
      disclosed_relevant_history: true,
      history_notes: parsed.data.historyNotes || null,
      consent_to_treatment: true,
      diabetes_response: parsed.data.diabetesResponse,
      epileptic_seizure_response: parsed.data.epilepticSeizureResponse,
      fainted_response: parsed.data.faintedResponse,
      heart_problem_response: parsed.data.heartProblemResponse,
      pacemaker_response: parsed.data.pacemakerResponse,
      circulation_problem_response: parsed.data.circulationProblemResponse,
      anticoagulation_response: parsed.data.anticoagulationResponse,
      cancer_response: parsed.data.cancerResponse,
      blood_borne_virus_response: parsed.data.bloodBorneVirusResponse,
      allergy_response: parsed.data.allergyResponse,
      pregnant_response: parsed.data.pregnantResponse,
      needle_phobia_response: parsed.data.needlePhobiaResponse,
      prior_needling_adverse_effect_response: parsed.data.priorNeedlingAdverseEffectResponse,
      eaten_within_two_hours_response: parsed.data.eatenWithinTwoHoursResponse,
      screening_notes: parsed.data.screeningNotes || null,
      signature_name: parsed.data.signatureName,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", consent.id);

  if (error) {
    return {
      error: error.message ?? "We could not submit the consent form. Please try again.",
    };
  }

  return {
    success:
      "Your acupuncture consent form has been submitted. Your clinician will review it before treatment proceeds.",
  };
}

export async function reviewAcupunctureConsentAction(formData: FormData) {
  const profile = await requireRole(["owner", "clinician", "admin"]);
  const consentId = getValue(formData, "consentId");
  const patientId = getValue(formData, "patientId");
  const decision = getValue(formData, "decision");
  const clinicianReviewNotes = getValue(formData, "clinicianReviewNotes");

  if (!consentId || !patientId) {
    throw new Error("Consent review is missing the patient or consent reference.");
  }

  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Consent review decision is invalid.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("acupuncture_consents")
    .select("id, status")
    .eq("id", consentId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message ?? "Failed to load the consent before review.");
  }

  if (existing.status !== "submitted") {
    throw new Error("Only submitted consent forms can be approved or rejected.");
  }

  const { error } = await supabase
    .from("acupuncture_consents")
    .update({
      status: decision,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      clinician_review_notes: clinicianReviewNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", consentId);

  if (error) {
    throw new Error(error.message ?? "Failed to review the consent form.");
  }

  await insertAuditLog({
    action: decision === "approved" ? "approve_acupuncture_consent" : "reject_acupuncture_consent",
    actorProfileId: profile.id,
    entityId: consentId,
    entityType: "acupuncture_consent",
    beforeState: { status: existing.status },
    afterState: { status: decision, clinician_review_notes: clinicianReviewNotes || null },
  });

  redirect(`/patients/${patientId}`);
}
