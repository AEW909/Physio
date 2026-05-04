import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const aiTreatmentPlanSummarySchema = z.object({
  presentingProblemSummary: z.string().trim().min(1),
  goalsSummary: z.string().trim().min(1),
  progressSummary: z.string().trim().min(1),
});

type GenerateTreatmentPlanSummariesInput = {
  planTitle: string;
  noteContent: Record<string, unknown>;
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

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

function asBoolean(value: unknown) {
  return value === true;
}

function formatCheckedFlags(source: Record<string, unknown>, labels: Record<string, string>) {
  return Object.entries(labels)
    .filter(([key]) => asBoolean(source[key]))
    .map(([, label]) => label);
}

function buildInitialAssessmentSummary(noteContent: Record<string, unknown>) {
  const history = asRecord(noteContent.history);
  const specialQuestions = asRecord(noteContent.special_questions);
  const cervicalQuestions = asRecord(noteContent.cervical_questions);
  const objective = asRecord(noteContent.objective);
  const impression = asRecord(noteContent.impression);
  const plan = asRecord(noteContent.plan);
  const modalities = asRecord(plan.modalities);

  const redFlags = formatCheckedFlags(specialQuestions, {
    weight_loss: "Weight loss",
    night_sweats: "Night sweats",
    poor_appetite: "Poor appetite",
    headache: "Headache",
    nausea: "Nausea",
    dizziness: "Dizziness",
    pins_and_needles: "Pins and needles",
    numbness: "Numbness",
    cough_sneeze: "Cough / sneeze aggravation",
    bladder_bowel: "Bladder / bowel change",
    saddle_anaesthesia: "Saddle anaesthesia",
    bilateral_symptoms: "Bilateral symptoms",
    constant_pain: "Constant pain",
    night_pain: "Night pain",
    tsp_pain: "Thoracic spine pain",
    malaise: "Malaise",
    symptoms_worsening: "Symptoms worsening",
  });

  const cervicalFlags = formatCheckedFlags(cervicalQuestions, {
    face_lips_tongue: "Face / lips / tongue symptoms",
    dexterity: "Dexterity change",
    eye_problems: "Eye problems",
    metal_taste: "Metal taste",
    dysphagia: "Dysphagia",
    clumsiness: "Clumsiness",
    head_support: "Needs head support",
    gait_disturbance: "Gait disturbance",
    clunking: "Clunking",
  });

  const modalitiesChosen = formatCheckedFlags(modalities, {
    reduce_pain: "Reduce pain",
    manual: "Manual therapy",
    increase_rom: "Increase ROM",
    electrotherapy: "Electrotherapy",
    return_to_sport_or_hobby: "Return to sport / hobby",
    acupuncture: "Acupuncture",
    improve_function: "Improve function",
    exercises_self_manage: "Exercises / self-management",
    return_to_work: "Return to work",
    advice: "Advice",
  });

  return [
    `Treatment plan label: ${asString(noteContent.plan_title) || "Not supplied"}`,
    `HPC: ${asString(history.hpc) || "Not recorded"}`,
    `Onset pattern: ${asStringArray(history.onset_pattern).join(", ") || "Not recorded"}`,
    `Investigations: ${asStringArray(history.investigations).join(", ") || "Not recorded"}`,
    `Symptom features: ${asStringArray(history.symptom_features).join(", ") || "Not recorded"}`,
    `Pain rating (NPRS): ${asString(history.nprs) || "Not recorded"}`,
    `Social history: ${asString(history.social_history) || "Not recorded"}`,
    `Diurnal pattern: ${asString(history.diurnal_pattern) || "Not recorded"}`,
    `Aggravating factors: ${asString(history.aggs) || "Not recorded"}`,
    `Easing factors: ${asString(history.ease) || "Not recorded"}`,
    `Special questions flagged: ${redFlags.join(", ") || "None recorded"}`,
    `Cervical-specific flags: ${cervicalFlags.join(", ") || "None recorded"}`,
    `Objective posture: ${asString(objective.posture) || "Not recorded"}`,
    `Objective ROM: ${asString(objective.rom) || "Not recorded"}`,
    `Associated joints ROM: ${asString(objective.associated_joints_rom) || "Not recorded"}`,
    `ULTT: ${asString(objective.ultt) || "Not recorded"}`,
    `Special tests: ${asString(objective.special_tests) || "Not recorded"}`,
    `Palpation: ${asString(objective.palpation) || "Not recorded"}`,
    `Myotomes: ${asString(objective.myotomes) || "Not recorded"}`,
    `Dermatomes: ${asString(objective.dermatomes) || "Not recorded"}`,
    `Reflexes: ${asString(objective.reflexes) || "Not recorded"}`,
    `SLR: ${asString(objective.slr) || "Not recorded"}`,
    `Other objective findings: ${asString(objective.other) || "Not recorded"}`,
    `Clinical opinion: ${asString(impression.opinion) || "Not recorded"}`,
    `Consent to treatment: ${asBoolean(impression.consent_to_treatment) ? "Yes" : "No / not recorded"}`,
    `Problems and goals from clinician: ${asString(plan.problems_and_goals) || "Not recorded"}`,
    `Outcome measure: ${asString(plan.measure) || "Not recorded"}`,
    `Timeframe in weeks: ${asString(plan.timeframe_weeks) || "Not recorded"}`,
    `Modalities selected: ${modalitiesChosen.join(", ") || "None recorded"}`,
    `Modality notes: ${asString(plan.modality_notes) || "Not recorded"}`,
  ].join("\n");
}

function extractStructuredOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return null;
}

export async function generateTreatmentPlanSummaries(input: GenerateTreatmentPlanSummariesInput) {
  const env = getServerEnv();
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      presentingProblemSummary: {
        type: "string",
        description: "A concise clinician-facing summary of the presenting problem and current working impression.",
      },
      goalsSummary: {
        type: "string",
        description: "A concise clinician-facing summary of the treatment goals and intended outcomes.",
      },
      progressSummary: {
        type: "string",
        description: "A short starter summary for future follow-ups describing the current baseline and focus.",
      },
    },
    required: ["presentingProblemSummary", "goalsSummary", "progressSummary"],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      instructions:
        "You are assisting a physiotherapy clinic with clinician-drafted treatment plan summaries. Use only the supplied initial assessment content. Keep wording concise, clinically useful, and neutral. Do not invent diagnoses, imaging results, red flags, or progress that are not supported by the note. Do not mention AI or uncertainty unless the record is genuinely too sparse.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Treatment plan name: ${input.planTitle}`,
                "",
                "Create three short clinician-facing summaries:",
                "1. Presenting problem summary",
                "2. Goals summary",
                "3. Progress summary starter for future follow-ups",
                "",
                "Requirements:",
                "- Use UK clinical English.",
                "- Keep each field to roughly 1-3 sentences.",
                "- Focus on the current problem episode only.",
                "- If the source note is thin, stay conservative and say what is currently being assessed or targeted.",
                "",
                "Initial assessment note:",
                buildInitialAssessmentSummary({
                  ...input.noteContent,
                  plan_title: input.planTitle,
                }),
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "treatment_plan_summaries",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as ResponsesApiPayload;
  const outputText = extractStructuredOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text.");
  }

  return aiTreatmentPlanSummarySchema.parse(JSON.parse(outputText));
}
