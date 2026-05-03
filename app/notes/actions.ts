"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNoteTemplateContent, NOTE_TYPE_LABELS } from "@/lib/notes/templates";
import type { NoteType } from "@/lib/notes/types";

export type CreateNoteState = {
  error?: string;
};

export type UpdateNoteState = {
  error?: string;
  success?: string;
};

const createNoteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  noteType: z.enum(["initial_assessment", "follow_up", "discharge"]),
});

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function createNoteAction(
  _prevState: CreateNoteState,
  formData: FormData,
): Promise<CreateNoteState> {
  const parsed = createNoteSchema.safeParse({
    patientId: getValue(formData, "patientId"),
    appointmentId: getValue(formData, "appointmentId"),
    noteType: getValue(formData, "noteType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unable to create note." };
  }

  const user = await requireUser();
  const values = parsed.data;
  const supabase = await createSupabaseServerClient();
  const title = NOTE_TYPE_LABELS[values.noteType as NoteType];

  const { data: noteData, error: noteError } = await supabase
    .from("clinical_notes")
    .insert({
      patient_id: values.patientId,
      appointment_id: values.appointmentId,
      note_type: values.noteType,
      title,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (noteError || !noteData) {
    return { error: noteError?.message ?? "Failed to create note." };
  }

  const { data: versionData, error: versionError } = await supabase
    .from("note_versions")
    .insert({
      clinical_note_id: noteData.id,
      source_type: "clinician_template",
      content: createNoteTemplateContent(values.noteType as NoteType),
      created_by: user.id,
      is_current: true,
    })
    .select("id")
    .single();

  if (versionError || !versionData) {
    return { error: versionError?.message ?? "Failed to create note version." };
  }

  const { error: linkError } = await supabase
    .from("clinical_notes")
    .update({ current_version_id: versionData.id })
    .eq("id", noteData.id);

  if (linkError) {
    return { error: linkError.message };
  }

  redirect(`/notes/${noteData.id}`);
}

const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  noteType: z.enum(["initial_assessment", "follow_up", "discharge"]),
  treatmentPlanId: z.string().uuid().optional(),
  submitIntent: z.enum(["save", "save_and_discharge"]).default("save"),
});

function buildNoteContent(noteType: NoteType, formData: FormData) {
  if (noteType === "initial_assessment") {
    return {
      history: {
        hpc: getValue(formData, "history.hpc"),
        onset_pattern: getList(formData, "history.onset_pattern"),
        investigations: getList(formData, "history.investigations"),
        symptom_features: getList(formData, "history.symptom_features"),
        nprs: getValue(formData, "history.nprs"),
        social_history: getValue(formData, "history.social_history"),
        diurnal_pattern: getValue(formData, "history.diurnal_pattern"),
        aggs: getValue(formData, "history.aggs"),
        ease: getValue(formData, "history.ease"),
      },
      special_questions: {
        weight_loss: getBoolean(formData, "special_questions.weight_loss"),
        night_sweats: getBoolean(formData, "special_questions.night_sweats"),
        poor_appetite: getBoolean(formData, "special_questions.poor_appetite"),
        headache: getBoolean(formData, "special_questions.headache"),
        nausea: getBoolean(formData, "special_questions.nausea"),
        dizziness: getBoolean(formData, "special_questions.dizziness"),
        pins_and_needles: getBoolean(formData, "special_questions.pins_and_needles"),
        numbness: getBoolean(formData, "special_questions.numbness"),
        cough_sneeze: getBoolean(formData, "special_questions.cough_sneeze"),
        bladder_bowel: getBoolean(formData, "special_questions.bladder_bowel"),
        saddle_anaesthesia: getBoolean(formData, "special_questions.saddle_anaesthesia"),
        bilateral_symptoms: getBoolean(formData, "special_questions.bilateral_symptoms"),
        constant_pain: getBoolean(formData, "special_questions.constant_pain"),
        night_pain: getBoolean(formData, "special_questions.night_pain"),
        tsp_pain: getBoolean(formData, "special_questions.tsp_pain"),
        malaise: getBoolean(formData, "special_questions.malaise"),
        symptoms_worsening: getBoolean(formData, "special_questions.symptoms_worsening"),
      },
      cervical_questions: {
        face_lips_tongue: getBoolean(formData, "cervical_questions.face_lips_tongue"),
        dexterity: getBoolean(formData, "cervical_questions.dexterity"),
        eye_problems: getBoolean(formData, "cervical_questions.eye_problems"),
        metal_taste: getBoolean(formData, "cervical_questions.metal_taste"),
        dysphagia: getBoolean(formData, "cervical_questions.dysphagia"),
        clumsiness: getBoolean(formData, "cervical_questions.clumsiness"),
        head_support: getBoolean(formData, "cervical_questions.head_support"),
        gait_disturbance: getBoolean(formData, "cervical_questions.gait_disturbance"),
        clunking: getBoolean(formData, "cervical_questions.clunking"),
      },
      objective: {
        posture: getValue(formData, "objective.posture"),
        rom: getValue(formData, "objective.rom"),
        associated_joints_rom: getValue(formData, "objective.associated_joints_rom"),
        ultt: getValue(formData, "objective.ultt"),
        other: getValue(formData, "objective.other"),
        special_tests: getValue(formData, "objective.special_tests"),
        palpation: getValue(formData, "objective.palpation"),
        myotomes: getValue(formData, "objective.myotomes"),
        dermatomes: getValue(formData, "objective.dermatomes"),
        reflexes: getValue(formData, "objective.reflexes"),
        slr: getValue(formData, "objective.slr"),
      },
      impression: {
        opinion: getValue(formData, "impression.opinion"),
        consent_to_treatment: getBoolean(formData, "impression.consent_to_treatment"),
      },
      plan: {
        problems_and_goals: getValue(formData, "plan.problems_and_goals"),
        measure: getValue(formData, "plan.measure"),
        timeframe_weeks: getValue(formData, "plan.timeframe_weeks"),
        modalities: {
          reduce_pain: getBoolean(formData, "plan.modalities.reduce_pain"),
          manual: getBoolean(formData, "plan.modalities.manual"),
          increase_rom: getBoolean(formData, "plan.modalities.increase_rom"),
          electrotherapy: getBoolean(formData, "plan.modalities.electrotherapy"),
          return_to_sport_or_hobby: getBoolean(formData, "plan.modalities.return_to_sport_or_hobby"),
          acupuncture: getBoolean(formData, "plan.modalities.acupuncture"),
          improve_function: getBoolean(formData, "plan.modalities.improve_function"),
          exercises_self_manage: getBoolean(formData, "plan.modalities.exercises_self_manage"),
          return_to_work: getBoolean(formData, "plan.modalities.return_to_work"),
          advice: getBoolean(formData, "plan.modalities.advice"),
        },
        modality_notes: getValue(formData, "plan.modality_notes"),
      },
    };
  }

  if (noteType === "follow_up") {
    return {
      subjective_update: getValue(formData, "subjective_update"),
      nprs: getValue(formData, "nprs"),
      response_to_previous_treatment: getValue(formData, "response_to_previous_treatment"),
      objective_reassessment: getValue(formData, "objective_reassessment"),
      treatment_today: getValue(formData, "treatment_today"),
      exercises_or_self_management: getValue(formData, "exercises_or_self_management"),
      progress_against_goal: getValue(formData, "progress_against_goal"),
      next_plan: getValue(formData, "next_plan"),
    };
  }

  return {
    presenting_problem_summary: getValue(formData, "presenting_problem_summary"),
    treatment_course_summary: getValue(formData, "treatment_course_summary"),
    outcome: getValue(formData, "outcome"),
    final_functional_status: getValue(formData, "final_functional_status"),
    advice_on_discharge: getValue(formData, "advice_on_discharge"),
    follow_up_recommendations: getValue(formData, "follow_up_recommendations"),
  };
}

export async function updateNoteAction(
  _prevState: UpdateNoteState,
  formData: FormData,
): Promise<UpdateNoteState> {
  const parsed = updateNoteSchema.safeParse({
    noteId: getValue(formData, "noteId"),
    noteType: getValue(formData, "noteType"),
    treatmentPlanId: getValue(formData, "treatmentPlanId") || undefined,
    submitIntent: getValue(formData, "submitIntent") || "save",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unable to save note." };
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const content = buildNoteContent(parsed.data.noteType as NoteType, formData);

  const { data: noteData, error: noteError } = await supabase
    .from("clinical_notes")
    .select("id, patient_id, treatment_plan_id, appointment_id, current_version_id")
    .eq("id", parsed.data.noteId)
    .maybeSingle();

  if (noteError || !noteData) {
    return { error: noteError?.message ?? "Failed to load note before saving." };
  }

  if (noteData.current_version_id) {
    const { error: unsetError } = await supabase
      .from("note_versions")
      .update({ is_current: false })
      .eq("id", noteData.current_version_id);

    if (unsetError) {
      return { error: unsetError.message };
    }
  }

  const { data: versionData, error: versionError } = await supabase
    .from("note_versions")
    .insert({
      clinical_note_id: parsed.data.noteId,
      source_type: "clinician_edit",
      content,
      created_by: user.id,
      is_current: true,
    })
    .select("id")
    .single();

  if (versionError || !versionData) {
    return { error: versionError?.message ?? "Failed to save note changes." };
  }

  const { error: linkError } = await supabase
    .from("clinical_notes")
    .update({
      current_version_id: versionData.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.noteId);

  if (linkError) {
    return { error: linkError.message };
  }

  if (parsed.data.noteType === "discharge" && parsed.data.treatmentPlanId) {
    const { error: completePlanError } = await supabase
      .from("treatment_plans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.treatmentPlanId);

    if (completePlanError) {
      return { error: completePlanError.message };
    }
  }

  if (parsed.data.noteType === "follow_up" && parsed.data.submitIntent === "save_and_discharge") {
    if (!noteData.treatment_plan_id) {
      return { error: "Treatment plan context is missing for discharge." };
    }

    const { data: existingDischarge } = await supabase
      .from("clinical_notes")
      .select("id")
      .eq("treatment_plan_id", noteData.treatment_plan_id)
      .eq("note_type", "discharge")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDischarge?.id) {
      redirect(`/notes/${existingDischarge.id}`);
    }

    let sessionLocation: string | null = null;
    if (noteData.appointment_id) {
      const { data: appointmentData } = await supabase
        .from("appointments")
        .select("location")
        .eq("id", noteData.appointment_id)
        .maybeSingle();

      sessionLocation = appointmentData?.location ?? null;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("appointments")
      .insert({
        patient_id: noteData.patient_id,
        treatment_plan_id: noteData.treatment_plan_id,
        scheduled_at: new Date().toISOString(),
        appointment_type: NOTE_TYPE_LABELS.discharge,
        status: "completed",
        clinician_id: user.id,
        location: sessionLocation,
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      return { error: sessionError?.message ?? "Failed to create discharge session." };
    }

    const { data: dischargeNoteData, error: dischargeNoteError } = await supabase
      .from("clinical_notes")
      .insert({
        patient_id: noteData.patient_id,
        appointment_id: sessionData.id,
        treatment_plan_id: noteData.treatment_plan_id,
        note_type: "discharge",
        title: NOTE_TYPE_LABELS.discharge,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (dischargeNoteError || !dischargeNoteData) {
      return { error: dischargeNoteError?.message ?? "Failed to create discharge note." };
    }

    const { data: dischargeVersionData, error: dischargeVersionError } = await supabase
      .from("note_versions")
      .insert({
        clinical_note_id: dischargeNoteData.id,
        source_type: "clinician_template",
        content: createNoteTemplateContent("discharge"),
        created_by: user.id,
        is_current: true,
      })
      .select("id")
      .single();

    if (dischargeVersionError || !dischargeVersionData) {
      return { error: dischargeVersionError?.message ?? "Failed to create discharge note version." };
    }

    const { error: dischargeLinkError } = await supabase
      .from("clinical_notes")
      .update({ current_version_id: dischargeVersionData.id })
      .eq("id", dischargeNoteData.id);

    if (dischargeLinkError) {
      return { error: dischargeLinkError.message };
    }

    revalidatePath(`/treatment-plans/${noteData.treatment_plan_id}`);
    redirect(`/notes/${dischargeNoteData.id}`);
  }

  if (parsed.data.treatmentPlanId) {
    revalidatePath(`/treatment-plans/${parsed.data.treatmentPlanId}`);
    redirect(`/treatment-plans/${parsed.data.treatmentPlanId}`);
  }

  revalidatePath(`/notes/${parsed.data.noteId}`);
  return { success: "Session note saved." };
}
