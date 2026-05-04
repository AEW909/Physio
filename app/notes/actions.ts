"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { generateFollowUpSupport } from "@/lib/ai/follow-up-support";
import { generateTreatmentPlanSummaries } from "@/lib/ai/treatment-plan-summaries";
import { insertAuditLog } from "@/lib/audit/insert-audit-log";
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

export type GenerateFollowUpSupportState = {
  error?: string;
  support?: {
    previousSessionSummary: string;
    followUpQuestions: string[];
    treatmentIdeas: string[];
  };
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

function getPlanGoals(formData: FormData) {
  return {
    reduce_pain: getBoolean(formData, "plan.goals.reduce_pain"),
    improve_function: getBoolean(formData, "plan.goals.improve_function"),
    increase_rom: getBoolean(formData, "plan.goals.increase_rom"),
    return_to_work: getBoolean(formData, "plan.goals.return_to_work"),
    return_to_sport_or_hobby: getBoolean(formData, "plan.goals.return_to_sport_or_hobby"),
  };
}

function getPlanModalities(formData: FormData) {
  return {
    manual: getBoolean(formData, "plan.modalities.manual"),
    electrotherapy: getBoolean(formData, "plan.modalities.electrotherapy"),
    ultrasound: getBoolean(formData, "plan.modalities.ultrasound"),
    acupuncture: getBoolean(formData, "plan.modalities.acupuncture"),
    exercises_self_manage: getBoolean(formData, "plan.modalities.exercises_self_manage"),
    advice: getBoolean(formData, "plan.modalities.advice"),
  };
}

function getMedicalHistory(formData: FormData) {
  return {
    past_medical_history: formData
      .getAll("medical_history.past_medical_history")
      .filter((value): value is string => typeof value === "string"),
    drug_history: getValue(formData, "medical_history.drug_history"),
    uses_steroids: getBoolean(formData, "medical_history.uses_steroids"),
    uses_anticoagulants: getBoolean(formData, "medical_history.uses_anticoagulants"),
    past_medical_history_details: getValue(formData, "medical_history.past_medical_history_details"),
    past_operations: getValue(formData, "medical_history.past_operations"),
  };
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
  submitIntent: z.enum(["save", "save_and_discharge", "save_and_generate_plan_summaries"]).default("save"),
});

const generateFollowUpSupportSchema = z.object({
  noteId: z.string().uuid(),
});

function buildNoteContent(noteType: NoteType, formData: FormData) {
  if (noteType === "initial_assessment") {
    return {
      history: {
        hpc: getValue(formData, "history.hpc"),
        onset_pattern: getList(formData, "history.onset_pattern"),
        investigations: getList(formData, "history.investigations"),
        symptom_features: getList(formData, "history.symptom_features"),
        nprs_best: getValue(formData, "history.nprs_best"),
        nprs_current: getValue(formData, "history.nprs_current"),
        nprs_worst: getValue(formData, "history.nprs_worst"),
        social_history: getValue(formData, "history.social_history"),
        pattern_factors: getValue(formData, "history.pattern_factors"),
      },
      medical_history: getMedicalHistory(formData),
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
        goals: getPlanGoals(formData),
        modalities: getPlanModalities(formData),
        actual_treatment_given: getValue(formData, "plan.actual_treatment_given"),
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

  if (parsed.data.noteType === "initial_assessment") {
    const medicalHistory = asRecord((content as Record<string, unknown>).medical_history);
    const { error: patientMedicalHistoryError } = await supabase
      .from("patients")
      .update({
        past_medical_history: asStringArray(medicalHistory.past_medical_history),
        drug_history: asString(medicalHistory.drug_history) || null,
        uses_steroids: medicalHistory.uses_steroids === true,
        uses_anticoagulants: medicalHistory.uses_anticoagulants === true,
        past_medical_history_details: asString(medicalHistory.past_medical_history_details) || null,
        past_operations: asString(medicalHistory.past_operations) || null,
      })
      .eq("id", noteData.patient_id);

    if (patientMedicalHistoryError) {
      return { error: patientMedicalHistoryError.message };
    }
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

  if (parsed.data.noteType === "initial_assessment" && parsed.data.submitIntent === "save_and_generate_plan_summaries") {
    if (!noteData.treatment_plan_id) {
      return { error: "Treatment plan context is missing for AI summary generation." };
    }

    const { data: plan, error: planError } = await supabase
      .from("treatment_plans")
      .select("id, title, presenting_problem_summary, goals_summary, progress_summary")
      .eq("id", noteData.treatment_plan_id)
      .maybeSingle();

    if (planError || !plan) {
      return { error: planError?.message ?? "Unable to load the treatment plan before AI summary generation." };
    }

    try {
      const summaries = await generateTreatmentPlanSummaries({
        planTitle: plan.title,
        noteContent: content as Record<string, unknown>,
      });

      const beforeState = {
        presenting_problem_summary: plan.presenting_problem_summary,
        goals_summary: plan.goals_summary,
        progress_summary: plan.progress_summary,
      };

      const afterState = {
        presenting_problem_summary: summaries.presentingProblemSummary,
        goals_summary: summaries.goalsSummary,
        progress_summary: summaries.progressSummary,
        source_note_id: noteData.id,
        source: "initial_assessment_ai_summary",
      };

      const { error: updatePlanError } = await supabase
        .from("treatment_plans")
        .update({
          presenting_problem_summary: summaries.presentingProblemSummary,
          goals_summary: summaries.goalsSummary,
          progress_summary: summaries.progressSummary,
        })
        .eq("id", noteData.treatment_plan_id);

      if (updatePlanError) {
        return {
          error: updatePlanError.message ?? "The note was saved, but the treatment plan summaries could not be updated.",
        };
      }

      await insertAuditLog({
        action: "generate_treatment_plan_summaries",
        actorProfileId: user.id,
        beforeState,
        afterState,
        entityId: noteData.treatment_plan_id,
        entityType: "treatment_plan",
      });

      revalidatePath(`/treatment-plans/${noteData.treatment_plan_id}`);
      redirect(`/treatment-plans/${noteData.treatment_plan_id}/edit?aiGenerated=1`);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      return {
        error: error instanceof Error ? error.message : "The note was saved, but AI summary generation failed.",
      };
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

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function summarizeFollowUpContent(content: Record<string, unknown>) {
  return [
    `Subjective update: ${asString(content.subjective_update) || "Not recorded"}`,
    `Pain rating (NPRS): ${asString(content.nprs) || "Not recorded"}`,
    `Response to previous treatment: ${asString(content.response_to_previous_treatment) || "Not recorded"}`,
    `Objective reassessment: ${asString(content.objective_reassessment) || "Not recorded"}`,
    `Treatment today: ${asString(content.treatment_today) || "Not recorded"}`,
    `Exercises or self-management: ${asString(content.exercises_or_self_management) || "Not recorded"}`,
    `Progress against goal: ${asString(content.progress_against_goal) || "Not recorded"}`,
    `Next plan: ${asString(content.next_plan) || "Not recorded"}`,
  ].join("\n");
}

function summarizeInitialAssessmentContent(content: Record<string, unknown>) {
  const history = asRecord(content.history);
  const objective = asRecord(content.objective);
  const impression = asRecord(content.impression);
  const plan = asRecord(content.plan);

  return [
    `HPC: ${asString(history.hpc) || "Not recorded"}`,
    `Pain rating (NPRS): Best ${asString(history.nprs_best) || "not recorded"}, Current ${asString(history.nprs_current) || asString(history.nprs) || "not recorded"}, Worst ${asString(history.nprs_worst) || "not recorded"}`,
    `Pattern, aggravating and easing factors: ${asString(history.pattern_factors) || "Not recorded"}`,
    `Objective ROM: ${asString(objective.rom) || "Not recorded"}`,
    `Special tests: ${asString(objective.special_tests) || "Not recorded"}`,
    `Clinical opinion: ${asString(impression.opinion) || "Not recorded"}`,
    `Problems and goals: ${asString(plan.problems_and_goals) || "Not recorded"}`,
    `Actual treatment given: ${asString(plan.actual_treatment_given) || "Not recorded"}`,
    `Modality notes: ${asString(plan.modality_notes) || "Not recorded"}`,
  ].join("\n");
}

function summarizeCurrentNote(noteType: NoteType, content: Record<string, unknown>) {
  if (noteType === "follow_up") {
    return summarizeFollowUpContent(content);
  }

  if (noteType === "initial_assessment") {
    return summarizeInitialAssessmentContent(content);
  }

  return [
    `Presenting problem summary: ${asString(content.presenting_problem_summary) || "Not recorded"}`,
    `Treatment course summary: ${asString(content.treatment_course_summary) || "Not recorded"}`,
    `Outcome: ${asString(content.outcome) || "Not recorded"}`,
  ].join("\n");
}

export async function generateFollowUpSupportAction(
  _prevState: GenerateFollowUpSupportState,
  formData: FormData,
): Promise<GenerateFollowUpSupportState> {
  const parsed = generateFollowUpSupportSchema.safeParse({
    noteId: getValue(formData, "noteId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unable to prepare follow-up AI support." };
  }

  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: note, error: noteError } = await supabase
    .from("clinical_notes")
    .select("id, note_type, treatment_plan_id, current_version_id")
    .eq("id", parsed.data.noteId)
    .maybeSingle();

  if (noteError || !note) {
    return { error: noteError?.message ?? "Unable to load the current note." };
  }

  if (note.note_type !== "follow_up") {
    return { error: "Follow-up AI support is only available on follow-up notes." };
  }

  if (!note.treatment_plan_id) {
    return { error: "Treatment plan context is missing for this follow-up." };
  }

  let currentDraftSummary = "No follow-up draft entered yet.";
  if (note.current_version_id) {
    const { data: currentVersion, error: currentVersionError } = await supabase
      .from("note_versions")
      .select("content")
      .eq("id", note.current_version_id)
      .maybeSingle();

    if (currentVersionError) {
      return { error: currentVersionError.message };
    }

    currentDraftSummary = summarizeCurrentNote(
      "follow_up",
      currentVersion?.content && typeof currentVersion.content === "object" && !Array.isArray(currentVersion.content)
        ? (currentVersion.content as Record<string, unknown>)
        : {},
    );
  }

  const { data: plan, error: planError } = await supabase
    .from("treatment_plans")
    .select("title, presenting_problem_summary, goals_summary, progress_summary")
    .eq("id", note.treatment_plan_id)
    .maybeSingle();

  if (planError || !plan) {
    return { error: planError?.message ?? "Unable to load treatment-plan context." };
  }

  const { data: priorNote, error: priorNoteError } = await supabase
    .from("clinical_notes")
    .select("id, note_type, current_version_id, created_at")
    .eq("treatment_plan_id", note.treatment_plan_id)
    .neq("id", note.id)
    .in("note_type", ["initial_assessment", "follow_up"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (priorNoteError) {
    return { error: priorNoteError.message };
  }

  let previousNoteSummary = "No earlier session note available.";

  if (priorNote?.current_version_id) {
    const { data: priorVersion, error: priorVersionError } = await supabase
      .from("note_versions")
      .select("content")
      .eq("id", priorNote.current_version_id)
      .maybeSingle();

    if (priorVersionError) {
      return { error: priorVersionError.message };
    }

    previousNoteSummary = summarizeCurrentNote(
      priorNote.note_type as NoteType,
      priorVersion?.content && typeof priorVersion.content === "object" && !Array.isArray(priorVersion.content)
        ? (priorVersion.content as Record<string, unknown>)
        : {},
    );
  }

  try {
    const support = await generateFollowUpSupport({
      planTitle: plan.title,
      presentingProblemSummary: plan.presenting_problem_summary,
      goalsSummary: plan.goals_summary,
      progressSummary: plan.progress_summary,
      previousNoteSummary,
      currentDraftSummary,
    });

    return { support };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to generate follow-up AI support.",
    };
  }
}
