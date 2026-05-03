"use client";

import { useActionState } from "react";
import { generateTreatmentPlanSummariesAction, type CreateTreatmentPlanState } from "@/app/treatment-plans/actions";

const initialState: CreateTreatmentPlanState = {};

type GeneratePlanSummariesFormProps = {
  noteId: string;
  planId: string;
};

export function GeneratePlanSummariesForm({ noteId, planId }: GeneratePlanSummariesFormProps) {
  const [state, formAction, pending] = useActionState(generateTreatmentPlanSummariesAction, initialState);

  return (
    <form action={formAction} className="stack">
      <input name="noteId" type="hidden" value={noteId} />
      <input name="planId" type="hidden" value={planId} />
      <p className="lede">
        Use the completed initial assessment to draft a presenting problem summary, goals summary, and a starter
        progress summary. You&apos;ll review the generated text on the treatment-plan edit screen before carrying on.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <div className="workspace-actions">
        <button className="button button-secondary" disabled={pending} type="submit">
          {pending ? "Generating AI summaries..." : "Generate AI summaries"}
        </button>
      </div>
    </form>
  );
}
