export type NoteType = "initial_assessment" | "follow_up" | "discharge";

export type ClinicalNoteListItem = {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  treatment_plan_id: string | null;
  note_type: NoteType;
  title: string;
  status: "draft" | "final" | "archived";
  created_at: string;
  updated_at: string;
};

export type NoteVersion = {
  id: string;
  clinical_note_id: string;
  source_type: string;
  content: Record<string, unknown>;
  ai_prompt_snapshot: Record<string, unknown> | null;
  transcript_snapshot: Record<string, unknown> | null;
  is_current: boolean;
  created_at: string;
};

export type ClinicalNoteDetail = ClinicalNoteListItem & {
  current_version_id: string | null;
  current_version: NoteVersion | null;
};
