import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentDetail, AppointmentListItem } from "@/lib/appointments/types";

export async function listAppointmentsForPatient(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, treatment_plan_id, scheduled_at, appointment_type, status, location, clinician_id, created_at")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load appointments: ${error.message}`);
  }

  return (data ?? []) as AppointmentListItem[];
}

export async function getAppointment(appointmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, treatment_plan_id, scheduled_at, appointment_type, status, location, clinician_id, created_at, updated_at")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load appointment: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  return data as AppointmentDetail;
}
