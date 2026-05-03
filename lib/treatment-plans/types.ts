import type { AppointmentListItem } from "@/lib/appointments/types";

export type TreatmentPlanStatus = "active" | "completed" | "on_hold";

export type TreatmentPlanSummary = {
  id: string;
  patient_id: string;
  title: string;
  status: TreatmentPlanStatus;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  presenting_problem_summary: string | null;
  goals_summary: string | null;
  progress_summary: string | null;
  overall_findings: string | null;
  first_session_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TreatmentPlanSessionItem = AppointmentListItem & {
  note_id: string | null;
  note_type: "initial_assessment" | "follow_up" | "discharge" | "referral" | null;
  note_title: string | null;
  note_status: "draft" | "final" | "archived" | null;
  note_updated_at: string | null;
};

export type TreatmentPlanWithSessions = TreatmentPlanSummary & {
  sessions: TreatmentPlanSessionItem[];
  archived_sessions: TreatmentPlanSessionItem[];
};
