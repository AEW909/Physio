export type AppointmentListItem = {
  id: string;
  patient_id: string;
  treatment_plan_id: string | null;
  scheduled_at: string;
  appointment_type: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  location: string | null;
  clinician_id: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
};

export type AppointmentDetail = AppointmentListItem & {
  updated_at: string;
};
