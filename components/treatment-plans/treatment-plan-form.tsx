"use client";

import { useActionState } from "react";
import {
  createTreatmentPlanAction,
  updateTreatmentPlanAction,
  type CreateTreatmentPlanState,
} from "@/app/treatment-plans/actions";
import type { TreatmentPlanSummary } from "@/lib/treatment-plans/types";

type TreatmentPlanFormProps =
  | {
      mode: "create";
      patientId: string;
    }
  | {
      mode: "edit";
      plan: TreatmentPlanSummary;
    };

const initialState: CreateTreatmentPlanState = {
  error: "",
};

export function TreatmentPlanForm(props: TreatmentPlanFormProps) {
  const action = props.mode === "create" ? createTreatmentPlanAction : updateTreatmentPlanAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="patient-form">
      {props.mode === "create" ? <input name="patientId" type="hidden" value={props.patientId} /> : null}
      {props.mode === "edit" ? <input name="planId" type="hidden" value={props.plan.id} /> : null}

      <div className="patient-form-grid">
        <label className="field field-full">
          <span>Treatment plan name</span>
          <input
            defaultValue={props.mode === "edit" ? props.plan.title : ""}
            name="title"
            placeholder="Back pain, elbow, knee..."
            type="text"
            required
          />
        </label>

        {props.mode === "edit" ? (
          <label className="field">
            <span>Status</span>
            <select className="select-field" defaultValue={props.plan.status} name="status">
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        ) : null}

        {props.mode === "edit" ? (
          <label className="field">
            <span>Date of first session</span>
            <input
              defaultValue={props.plan.first_session_at ? new Date(props.plan.first_session_at).toLocaleString("en-GB") : "Not recorded yet"}
              disabled
              type="text"
            />
          </label>
        ) : null}

        {props.mode === "edit" ? (
          <label className="field field-full">
            <span>Presenting problem summary</span>
            <textarea
              defaultValue={props.plan.presenting_problem_summary ?? ""}
              name="presentingProblemSummary"
              rows={4}
            />
          </label>
        ) : null}

        {props.mode === "edit" ? (
          <label className="field field-full">
            <span>Goals summary</span>
            <textarea defaultValue={props.plan.goals_summary ?? ""} name="goalsSummary" rows={4} />
          </label>
        ) : null}

        {props.mode === "edit" ? (
          <label className="field field-full">
            <span>Progress summary</span>
            <textarea defaultValue={props.plan.progress_summary ?? ""} name="progressSummary" rows={4} />
          </label>
        ) : null}

        {props.mode === "edit" ? (
          <label className="field field-full">
            <span>Overall findings</span>
            <textarea defaultValue={props.plan.overall_findings ?? ""} name="overallFindings" rows={4} />
          </label>
        ) : null}
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button-primary" disabled={pending} type="submit">
        {pending
          ? props.mode === "create"
            ? "Creating plan..."
            : "Saving plan..."
          : props.mode === "create"
            ? "Create treatment plan"
            : "Save treatment plan"}
      </button>
    </form>
  );
}
