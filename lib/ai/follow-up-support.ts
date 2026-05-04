import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const aiFollowUpSupportSchema = z.object({
  previousSessionSummary: z.string().trim().min(1),
  followUpQuestions: z.array(z.string().trim().min(1)).min(1).max(6),
  treatmentIdeas: z.array(z.string().trim().min(1)).min(1).max(6),
});

type GenerateFollowUpSupportInput = {
  planTitle: string;
  presentingProblemSummary: string | null;
  goalsSummary: string | null;
  progressSummary: string | null;
  previousNoteSummary: string;
  currentDraftSummary: string;
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

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

export async function generateFollowUpSupport(input: GenerateFollowUpSupportInput) {
  const env = getServerEnv();
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      previousSessionSummary: {
        type: "string",
        description: "A concise summary of the most relevant previous session context for this follow-up.",
      },
      followUpQuestions: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "Clinically relevant follow-up questions to consider asking during this review.",
      },
      treatmentIdeas: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "Conservative treatment directions or management ideas to consider for this follow-up.",
      },
    },
    required: ["previousSessionSummary", "followUpQuestions", "treatmentIdeas"],
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
        "You are assisting a physiotherapy clinic with follow-up review preparation. Stay concise, clinician-facing, and conservative. Use only the provided treatment-plan and note context. Do not invent diagnoses, new findings, contraindications, or treatment that are not supported by the notes. Offer suggestions, not instructions.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Treatment plan: ${input.planTitle}`,
                `Presenting problem summary: ${input.presentingProblemSummary || "Not yet written"}`,
                `Goals summary: ${input.goalsSummary || "Not yet written"}`,
                `Progress summary: ${input.progressSummary || "Not yet written"}`,
                "",
                `Previous session context: ${input.previousNoteSummary || "No earlier session note available."}`,
                "",
                `Current follow-up draft: ${input.currentDraftSummary || "No follow-up draft entered yet."}`,
                "",
                "Return:",
                "- a short previous session summary for the clinician to glance at",
                "- 3 to 5 useful follow-up questions",
                "- 3 to 5 possible treatment or management ideas to consider",
                "",
                "Use UK clinical English. Keep each item short and practical.",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "follow_up_support",
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
    throw new Error("OpenAI response did not include structured follow-up support text.");
  }

  return aiFollowUpSupportSchema.parse(JSON.parse(outputText));
}
