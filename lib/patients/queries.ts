import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientDetail, PatientListItem } from "@/lib/patients/types";

export async function listPatients(
  search?: string,
  status: "active" | "archived" = "active",
  sort: "surname" | "last_seen" = "surname",
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, email, phone, created_at, updated_at, is_archived, archived_at")
    .eq("is_archived", status === "archived");

  const term = search?.trim();
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load patients: ${error.message}`);
  }

  const patients: PatientListItem[] = ((data ?? []) as PatientListItem[]).map((patient) => ({
    ...patient,
    last_seen_at: null,
  }));

  if (!patients.length) {
    return patients;
  }

  const patientIds = patients.map((patient) => patient.id);
  const { data: appointmentData, error: appointmentError } = await supabase
    .from("appointments")
    .select("patient_id, scheduled_at")
    .in("patient_id", patientIds)
    .eq("is_archived", false)
    .order("scheduled_at", { ascending: false });

  if (appointmentError) {
    throw new Error(`Failed to load patient last-seen dates: ${appointmentError.message}`);
  }

  const lastSeenByPatient = new Map<string, string>();
  for (const row of (appointmentData ?? []) as Array<{ patient_id: string; scheduled_at: string }>) {
    if (!lastSeenByPatient.has(row.patient_id)) {
      lastSeenByPatient.set(row.patient_id, row.scheduled_at);
    }
  }

  patients.forEach((patient) => {
    patient.last_seen_at = lastSeenByPatient.get(patient.id) ?? null;
  });

  if (sort === "last_seen") {
    patients.sort((left, right) => {
      const leftTime = left.last_seen_at ? new Date(left.last_seen_at).getTime() : 0;
      const rightTime = right.last_seen_at ? new Date(right.last_seen_at).getTime() : 0;
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      const surnameCompare = left.last_name.localeCompare(right.last_name, "en-GB", { sensitivity: "base" });
      if (surnameCompare !== 0) return surnameCompare;
      return left.first_name.localeCompare(right.first_name, "en-GB", { sensitivity: "base" });
    });
  } else {
    patients.sort((left, right) => {
      const surnameCompare = left.last_name.localeCompare(right.last_name, "en-GB", { sensitivity: "base" });
      if (surnameCompare !== 0) return surnameCompare;
      return left.first_name.localeCompare(right.first_name, "en-GB", { sensitivity: "base" });
    });
  }

  return patients;
}

export async function getPatient(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, date_of_birth, email, phone, address, emergency_contact_name, emergency_contact_phone, gp_name, gp_contact, consent_status, drug_history, uses_steroids, uses_anticoagulants, past_medical_history, past_medical_history_details, past_operations, is_archived, archived_at, archived_by, deletion_requested_at, deletion_reason, erased_at, created_at, updated_at",
    )
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load patient: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return data as PatientDetail;
}
