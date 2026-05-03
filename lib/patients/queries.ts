import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientDetail, PatientListItem } from "@/lib/patients/types";

export async function listPatients(search?: string, status: "active" | "archived" = "active") {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, email, phone, created_at, is_archived, archived_at")
    .eq("is_archived", status === "archived")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

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

  return (data ?? []) as PatientListItem[];
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
