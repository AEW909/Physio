"use client";

import { useActionState } from "react";
import { generateFollowUpSupportAction, type GenerateFollowUpSupportState } from "@/app/notes/actions";

const initialState: GenerateFollowUpSupportState = {};

type FollowUpAiSupportProps = {
  noteId: string;
};

export function FollowUpAiSupport({ noteId }: FollowUpAiSupportProps) {
  const [state, formAction, pending] = useActionState(generateFollowUpSupportAction, initialState);

  return (
    <section className="card stack">
      <h2>AI follow-up support</h2>
      <p className="lede">
        Generate a short summary of the previous session plus suggested follow-up questions and treatment ideas to
        consider. These are prompts only and won&apos;t change the note automatically.
      </p>
      <form action={formAction} className="stack">
        <input name="noteId" type="hidden" value={noteId} />
        <div className="workspace-actions">
          <button className="button button-secondary" disabled={pending} type="submit">
            {pending ? "Generating follow-up support..." : "Generate follow-up support"}
          </button>
        </div>
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </form>

      {state.support ? (
        <div className="detail-grid">
          <section className="card stack">
            <h3>Previous session summary</h3>
            <p className="lede">{state.support.previousSessionSummary}</p>
          </section>
          <section className="card stack">
            <h3>Suggested follow-up questions</h3>
            <ul className="panel-list">
              {state.support.followUpQuestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="card stack">
            <h3>Suggested treatment ideas</h3>
            <ul className="panel-list">
              {state.support.treatmentIdeas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  );
}
