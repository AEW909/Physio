"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreatePatientState = {
  error?: string;
};

const patientSchema = z.object({
  patientId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  dateOfBirth: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address.").or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  gpName: z.string().trim().optional(),
  gpContact: z.string().trim().optional(),
  consentStatus: z.string().trim().optional(),
  drugHistory: z.string().trim().optional(),
  usesSteroids: z.boolean().default(false),
  usesAnticoagulants: z.boolean().default(false),
  pastMedicalHistoryDetails: z.string().trim().optional(),
  pastOperations: z.string().trim().optional(),
  pastMedicalHistory: z.array(z.string().trim()).default([]),
});

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parsePatientForm(formData: FormData) {
  return patientSchema.safeParse({
    patientId: getValue(formData, "patientId") || undefined,
    firstName: getValue(formData, "firstName"),
    lastName: getValue(formData, "lastName"),
    dateOfBirth: getValue(formData, "dateOfBirth"),
    email: getValue(formData, "email"),
    phone: getValue(formData, "phone"),
    address: getValue(formData, "address"),
    emergencyContactName: getValue(formData, "emergencyContactName"),
    emergencyContactPhone: getValue(formData, "emergencyContactPhone"),
    gpName: getValue(formData, "gpName"),
    gpContact: getValue(formData, "gpContact"),
    consentStatus: getValue(formData, "consentStatus"),
    drugHistory: getValue(formData, "drugHistory"),
    usesSteroids: formData.get("usesSteroids") === "yes",
    usesAnticoagulants: formData.get("usesAnticoagulants") === "yes",
    pastMedicalHistoryDetails: getValue(formData, "pastMedicalHistoryDetails"),
    pastOperations: getValue(formData, "pastOperations"),
    pastMedicalHistory: formData
      .getAll("pastMedicalHistory")
      .filter((value): value is string => typeof value === "string"),
  });
}

export async function createPatientAction(
  _prevState: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter the required patient details.",
    };
  }

  const user = await requireUser();
  const values = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      first_name: values.firstName,
      last_name: values.lastName,
      date_of_birth: values.dateOfBirth || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      emergency_contact_name: values.emergencyContactName || null,
      emergency_contact_phone: values.emergencyContactPhone || null,
      gp_name: values.gpName || null,
      gp_contact: values.gpContact || null,
      consent_status: values.consentStatus || null,
      drug_history: values.drugHistory || null,
      uses_steroids: values.usesSteroids,
      uses_anticoagulants: values.usesAnticoagulants,
      past_medical_history: values.pastMedicalHistory,
      past_medical_history_details: values.pastMedicalHistoryDetails || null,
      past_operations: values.pastOperations || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create the patient record.",
    };
  }

  redirect(`/patients/${data.id}`);
}

export async function updatePatientAction(
  _prevState: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter the required patient details.",
    };
  }

  const user = await requireUser();
  const values = parsed.data;

  if (!values.patientId) {
    return {
      error: "Patient ID is missing.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("patients")
    .update({
      first_name: values.firstName,
      last_name: values.lastName,
      date_of_birth: values.dateOfBirth || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      emergency_contact_name: values.emergencyContactName || null,
      emergency_contact_phone: values.emergencyContactPhone || null,
      gp_name: values.gpName || null,
      gp_contact: values.gpContact || null,
      consent_status: values.consentStatus || null,
      drug_history: values.drugHistory || null,
      uses_steroids: values.usesSteroids,
      uses_anticoagulants: values.usesAnticoagulants,
      past_medical_history: values.pastMedicalHistory,
      past_medical_history_details: values.pastMedicalHistoryDetails || null,
      past_operations: values.pastOperations || null,
      created_by: user.id,
    })
    .eq("id", values.patientId);

  if (error) {
    return {
      error: error.message ?? "Failed to update the patient record.",
    };
  }

  redirect(`/patients/${values.patientId}`);
}

export async function archivePatientAction(formData: FormData) {
  const user = await requireUser();
  const patientId = getValue(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: patient, error: fetchError } = await supabase
    .from("patients")
    .select("id, is_archived")
    .eq("id", patientId)
    .single();

  if (fetchError || !patient) {
    throw new Error(fetchError?.message ?? "Failed to load patient before archive.");
  }

  const { error } = await supabase
    .from("patients")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "archive_patient",
    actorProfileId: user.id,
    beforeState: { is_archived: patient.is_archived },
    afterState: { is_archived: true },
    entityId: patientId,
    entityType: "patient",
  });

  redirect("/patients");
}

export async function restorePatientAction(formData: FormData) {
  const user = await requireUser();
  const patientId = getValue(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient ID is missing.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: patient, error: fetchError } = await supabase
    .from("patients")
    .select("id, is_archived")
    .eq("id", patientId)
    .single();

  if (fetchError || !patient) {
    throw new Error(fetchError?.message ?? "Failed to load patient before restore.");
  }

  const { error } = await supabase
    .from("patients")
    .update({
      is_archived: false,
      archived_at: null,
      archived_by: null,
    })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  await insertAuditLog({
    action: "restore_patient",
    actorProfileId: user.id,
    beforeState: { is_archived: patient.is_archived },
    afterState: { is_archived: false },
    entityId: patientId,
    entityType: "patient",
  });

  redirect(`/patients/${patientId}`);
}
