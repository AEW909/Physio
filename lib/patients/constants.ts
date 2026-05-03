export const PAST_MEDICAL_HISTORY_OPTIONS = [
  "Heart Issues",
  "Rheumatoid Arthritis",
  "Chest / Breathing Issues",
  "Epilepsy",
  "Diabetes",
  "Blood Pressure",
  "Ankylosing Spondylitis",
  "Cancer",
  "Tuberculosis",
  "Pacemaker",
  "Pregnant",
  "Trauma",
  "Osteoporosis",
  "Thyroid",
] as const;

export type PastMedicalHistoryOption = (typeof PAST_MEDICAL_HISTORY_OPTIONS)[number];
