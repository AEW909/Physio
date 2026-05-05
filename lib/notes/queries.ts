import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClinicalNoteDetail, ClinicalNoteListItem, NoteVersion } from "@/lib/notes/types";

export async function listNotesForAppointment(appointmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("id, patient_id, appointment_id, treatment_plan_id, note_type, title, status, created_at, updated_at")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load notes: ${error.message}`);
  }

  return (data ?? []) as ClinicalNoteListItem[];
}

export async function getClinicalNote(noteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(
      "id, patient_id, appointment_id, treatment_plan_id, note_type, title, status, current_version_id, created_at, updated_at",
    )
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load note: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  let currentVersion: NoteVersion | null = null;
  if (data.current_version_id) {
    const { data: versionData, error: versionError } = await supabase
      .from("note_versions")
      .select(
        "id, clinical_note_id, source_type, content, ai_prompt_snapshot, transcript_snapshot, is_current, created_at",
      )
      .eq("id", data.current_version_id)
      .maybeSingle();

    if (versionError) {
      throw new Error(`Failed to load note version: ${versionError.message}`);
    }

    currentVersion = (versionData ?? null) as NoteVersion | null;
  }

  return {
    ...(data as Omit<ClinicalNoteDetail, "current_version">),
    current_version: currentVersion,
  } as ClinicalNoteDetail;
}

export async function listDraftNotesForClinician(clinicianId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("id, patient_id, appointment_id, treatment_plan_id, note_type, title, status, created_at, updated_at")
    .eq("status", "draft")
    .eq("created_by", clinicianId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load draft notes: ${error.message}`);
  }

  return (data ?? []) as ClinicalNoteListItem[];
}
