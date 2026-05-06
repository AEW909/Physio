import type { NoteType } from "@/lib/notes/types";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  initial_assessment: "Initial assessment",
  follow_up: "Follow-up",
  discharge: "Discharge",
};

export const ONSET_PATTERN_OPTIONS = [
  { value: "acute", label: "Acute" },
  { value: "chronic", label: "Chronic" },
  { value: "acute_on_chronic", label: "A on C" },
  { value: "insidious", label: "Insidious" },
  { value: "trauma", label: "Trauma" },
] as const;

export const INVESTIGATION_OPTIONS = [
  { value: "xray", label: "X-ray" },
  { value: "bloods", label: "Bloods" },
  { value: "dexa", label: "DEXA" },
  { value: "mri", label: "MRI" },
] as const;

export const SYMPTOM_FEATURE_OPTIONS = [
  { value: "locking", label: "Locking" },
  { value: "clicking", label: "Clicking" },
  { value: "giving_way", label: "Giving way" },
  { value: "swelling", label: "Swelling" },
] as const;

export const SPECIAL_QUESTION_OPTIONS = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "night_sweats", label: "Night sweats" },
  { value: "poor_appetite", label: "Poor appetite" },
  { value: "headache", label: "Headache" },
  { value: "nausea", label: "Nausea" },
  { value: "dizziness", label: "Dizziness" },
  { value: "numbness", label: "Numbness" },
  { value: "cough_sneeze", label: "Cough / sneeze" },
  { value: "bladder_bowel", label: "Bladder / bowel" },
  { value: "saddle_anaesthesia", label: "Saddle anaesthesia" },
  { value: "bilateral_symptoms", label: "Bilateral symptoms" },
  { value: "constant_pain", label: "Constant pain" },
  { value: "night_pain", label: "Night pain" },
  { value: "tsp_pain", label: "TSP pain" },
  { value: "malaise", label: "Malaise" },
  { value: "symptoms_worsening", label: "Symptoms worsening" },
] as const;

export const CERVICAL_QUESTION_OPTIONS = [
  { value: "face_lips_tongue", label: "Face / lips / tongue" },
  { value: "dexterity", label: "Dexterity" },
  { value: "eye_problems", label: "Eye problems" },
  { value: "metal_taste", label: "Metal taste" },
  { value: "dysphagia", label: "Dysphagia" },
  { value: "clumsiness", label: "Clumsiness" },
  { value: "head_support", label: "Head support" },
  { value: "gait_disturbance", label: "Gait disturbance" },
  { value: "clunking", label: "Clunking" },
] as const;

export const MODALITY_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "electrotherapy", label: "Electrotherapy" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "acupuncture", label: "Acupuncture" },
  { value: "exercises_self_manage", label: "Exercises / self-manage" },
  { value: "advice", label: "Advice" },
] as const;

export const GOAL_OPTIONS = [
  { value: "reduce_pain", label: "Reduce pain" },
  { value: "improve_function", label: "Improve function" },
  { value: "increase_rom", label: "Increase ROM" },
  { value: "return_to_work", label: "Return to work" },
  { value: "return_to_sport_or_hobby", label: "Return to sport / hobby" },
] as const;

export function createInitialAssessmentContent() {
  return {
    history: {
      pc: "",
      hpc: "",
      onset_pattern: [] as string[],
      investigations: [] as string[],
      symptom_features: [] as string[],
      nprs_best: "",
      nprs_current: "",
      nprs_worst: "",
      social_history: "",
      diurnal_pattern: "",
      aggravating_factors: "",
      easing_factors: "",
    },
    medical_history: {
      past_medical_history: [] as string[],
      blood_pressure: [] as string[],
      diabetes: [] as string[],
      no_significant_history: false,
      medication_history: "",
      uses_steroids: false,
      uses_anticoagulants: false,
      past_medical_history_details: "",
      past_operations: "",
    },
    special_questions: {
      weight_loss: false,
      night_sweats: false,
      poor_appetite: false,
      headache: false,
      nausea: false,
      dizziness: false,
      pins_and_needles_intermittent: false,
      pins_and_needles_constant: false,
      numbness: false,
      cough_sneeze: false,
      bladder_bowel: false,
      saddle_anaesthesia: false,
      bilateral_symptoms: false,
      constant_pain: false,
      night_pain: false,
      tsp_pain: false,
      malaise: false,
      symptoms_worsening: false,
    },
    cervical_questions: {
      face_lips_tongue: false,
      dexterity: false,
      eye_problems: false,
      metal_taste: false,
      dysphagia: false,
      clumsiness: false,
      head_support: false,
      gait_disturbance: false,
      clunking: false,
    },
    objective: {
      posture: "",
      rom: "",
      associated_joints_rom: "",
      ultt: "",
      other: "",
      special_tests: "",
      palpation: "",
      myotomes: "",
      dermatomes: "",
      reflexes: "",
      slr: "",
    },
    impression: {
      opinion: "",
      consent_to_treatment: true,
    },
      plan: {
        problems_and_goals: "",
        measure: "",
        timeframe_weeks: "",
      goals: {
        reduce_pain: false,
        improve_function: false,
        increase_rom: false,
        return_to_work: false,
        return_to_sport_or_hobby: false,
      },
      modalities: {
        manual: false,
        electrotherapy: false,
        ultrasound: false,
        acupuncture: false,
        exercises_self_manage: false,
        advice: false,
      },
        actual_treatment_given: "",
    },
    };
}

export function createFollowUpContent() {
  return {
    subjective_update: "",
    nprs_best: "",
    nprs_current: "",
    nprs_worst: "",
    response_to_previous_treatment: "",
    objective_reassessment: "",
    treatment_today: "",
    exercises_or_self_management: "",
    progress_against_goal: "",
    next_plan: "",
  };
}

export function createDischargeContent() {
  return {
    presenting_problem_summary: "",
    treatment_course_summary: "",
    outcome: "",
    final_functional_status: "",
    advice_on_discharge: "",
    follow_up_recommendations: "",
  };
}

export function createNoteTemplateContent(noteType: NoteType) {
  if (noteType === "initial_assessment") return createInitialAssessmentContent();
  if (noteType === "follow_up") return createFollowUpContent();
  return createDischargeContent();
}
