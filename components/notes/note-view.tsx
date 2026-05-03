"use client";

import { useActionState } from "react";
import { updateNoteAction } from "@/app/notes/actions";
import {
  CERVICAL_QUESTION_OPTIONS,
  INVESTIGATION_OPTIONS,
  MODALITY_OPTIONS,
  ONSET_PATTERN_OPTIONS,
  SPECIAL_QUESTION_OPTIONS,
  SYMPTOM_FEATURE_OPTIONS,
} from "@/lib/notes/templates";
import type { ClinicalNoteDetail } from "@/lib/notes/types";

type NoteViewProps = {
  note: ClinicalNoteDetail;
};

const initialState = {
  error: "",
  success: "",
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asBoolean(value: unknown) {
  return value === true;
}

function CheckboxGroup({
  legend,
  name,
  options,
  selected,
  compact = false,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  compact?: boolean;
}) {
  return (
    <fieldset className="checkbox-panel note-checkbox-panel">
      <legend>{legend}</legend>
      <div className={compact ? "note-checkbox-grid note-checkbox-grid-compact" : "note-checkbox-grid"}>
        {options.map((option) => (
          <label className="note-check" key={option.value}>
            <input defaultChecked={selected.includes(option.value)} name={name} type="checkbox" value={option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BooleanGrid({
  legend,
  prefix,
  options,
  values,
}: {
  legend: string;
  prefix: string;
  options: readonly { value: string; label: string }[];
  values: Record<string, unknown>;
}) {
  return (
    <fieldset className="checkbox-panel note-checkbox-panel">
      <legend>{legend}</legend>
      <div className="note-checkbox-grid note-checkbox-grid-dense">
        {options.map((option) => (
          <label className="note-check" key={option.value}>
            <input
              defaultChecked={asBoolean(values[option.value])}
              name={`${prefix}.${option.value}`}
              type="checkbox"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NoteTextarea({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea defaultValue={defaultValue} name={name} rows={rows} />
    </label>
  );
}

export function NoteView({ note }: NoteViewProps) {
  const [state, formAction, pending] = useActionState(updateNoteAction, initialState);
  const content = asRecord(note.current_version?.content ?? {});
  const history = asRecord(content.history);
  const specialQuestions = asRecord(content.special_questions);
  const cervicalQuestions = asRecord(content.cervical_questions);
  const objective = asRecord(content.objective);
  const impression = asRecord(content.impression);
  const plan = asRecord(content.plan);
  const modalities = asRecord(plan.modalities);

  return (
    <form action={formAction} className="note-form">
      <input name="noteId" type="hidden" value={note.id} />
      <input name="noteType" type="hidden" value={note.note_type} />
      <input name="treatmentPlanId" type="hidden" value={note.treatment_plan_id ?? ""} />

      <div className="workspace-actions">
        <button className="button button-primary" disabled={pending} name="submitIntent" type="submit" value="save">
          {pending ? "Saving note..." : "Save note"}
        </button>
        {note.note_type === "follow_up" ? (
          <button
            className="button button-management"
            disabled={pending}
            name="submitIntent"
            type="submit"
            value="save_and_discharge"
          >
            {pending ? "Saving + preparing discharge..." : "Save + Discharge patient"}
          </button>
        ) : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </div>

      {note.note_type === "initial_assessment" ? (
        <div className="note-grid">
          <section className="card stack note-card note-card-wide">
            <h2>Subjective history</h2>
            <div className="note-form-grid">
              <NoteTextarea label="HPC" name="history.hpc" defaultValue={asString(history.hpc)} rows={5} />
              <NoteTextarea
                label="Social history"
                name="history.social_history"
                defaultValue={asString(history.social_history)}
                rows={5}
              />
              <CheckboxGroup
                compact
                legend="Onset pattern"
                name="history.onset_pattern"
                options={ONSET_PATTERN_OPTIONS}
                selected={asStringArray(history.onset_pattern)}
              />
              <CheckboxGroup
                compact
                legend="Investigations"
                name="history.investigations"
                options={INVESTIGATION_OPTIONS}
                selected={asStringArray(history.investigations)}
              />
              <CheckboxGroup
                compact
                legend="Symptom features"
                name="history.symptom_features"
                options={SYMPTOM_FEATURE_OPTIONS}
                selected={asStringArray(history.symptom_features)}
              />
              <label className="field">
                <span>NPRS</span>
                <input defaultValue={asString(history.nprs)} name="history.nprs" type="text" />
              </label>
              <label className="field">
                <span>Diurnal pattern</span>
                <input defaultValue={asString(history.diurnal_pattern)} name="history.diurnal_pattern" type="text" />
              </label>
              <NoteTextarea label="Aggravating factors" name="history.aggs" defaultValue={asString(history.aggs)} rows={3} />
              <NoteTextarea label="Easing factors" name="history.ease" defaultValue={asString(history.ease)} rows={3} />
            </div>
          </section>

          <section className="card stack note-card">
            <h2>Special questions</h2>
            <BooleanGrid
              legend="Red flags and special questions"
              prefix="special_questions"
              options={SPECIAL_QUESTION_OPTIONS}
              values={specialQuestions}
            />
          </section>

          <section className="card stack note-card">
            <h2>Cervical-specific</h2>
            <BooleanGrid
              legend="Cervical questions"
              prefix="cervical_questions"
              options={CERVICAL_QUESTION_OPTIONS}
              values={cervicalQuestions}
            />
          </section>

          <section className="card stack note-card note-card-wide">
            <h2>Objective examination</h2>
            <div className="note-form-grid">
              <NoteTextarea label="Posture" name="objective.posture" defaultValue={asString(objective.posture)} rows={3} />
              <NoteTextarea label="ROM" name="objective.rom" defaultValue={asString(objective.rom)} rows={3} />
              <NoteTextarea
                label="Associated joints ROM"
                name="objective.associated_joints_rom"
                defaultValue={asString(objective.associated_joints_rom)}
                rows={3}
              />
              <NoteTextarea label="ULTT" name="objective.ultt" defaultValue={asString(objective.ultt)} rows={3} />
              <NoteTextarea
                label="Special tests"
                name="objective.special_tests"
                defaultValue={asString(objective.special_tests)}
                rows={3}
              />
              <NoteTextarea label="Palpation" name="objective.palpation" defaultValue={asString(objective.palpation)} rows={3} />
              <NoteTextarea label="Myotomes" name="objective.myotomes" defaultValue={asString(objective.myotomes)} rows={3} />
              <NoteTextarea
                label="Dermatomes"
                name="objective.dermatomes"
                defaultValue={asString(objective.dermatomes)}
                rows={3}
              />
              <NoteTextarea label="Reflexes" name="objective.reflexes" defaultValue={asString(objective.reflexes)} rows={3} />
              <NoteTextarea label="SLR" name="objective.slr" defaultValue={asString(objective.slr)} rows={3} />
              <NoteTextarea label="Other" name="objective.other" defaultValue={asString(objective.other)} rows={3} />
            </div>
          </section>

          <section className="card stack note-card">
            <h2>Impression</h2>
            <div className="note-form-grid note-form-grid-single">
              <NoteTextarea label="Opinion" name="impression.opinion" defaultValue={asString(impression.opinion)} rows={5} />
              <label className="note-check note-check-inline">
                <input
                  defaultChecked={asBoolean(impression.consent_to_treatment)}
                  name="impression.consent_to_treatment"
                  type="checkbox"
                />
                <span>Consent to treatment</span>
              </label>
            </div>
          </section>

          <section className="card stack note-card">
            <h2>Plan</h2>
            <div className="note-form-grid note-form-grid-single">
              <NoteTextarea
                label="Problems and goals"
                name="plan.problems_and_goals"
                defaultValue={asString(plan.problems_and_goals)}
                rows={4}
              />
              <NoteTextarea label="Measure" name="plan.measure" defaultValue={asString(plan.measure)} rows={3} />
              <label className="field">
                <span>Timeframe (weeks)</span>
                <input defaultValue={asString(plan.timeframe_weeks)} name="plan.timeframe_weeks" type="text" />
              </label>
              <BooleanGrid legend="Modalities" prefix="plan.modalities" options={MODALITY_OPTIONS} values={modalities} />
              <NoteTextarea
                label="Modality notes"
                name="plan.modality_notes"
                defaultValue={asString(plan.modality_notes)}
                rows={4}
              />
            </div>
          </section>
        </div>
      ) : null}

      {note.note_type === "follow_up" ? (
        <div className="note-grid note-grid-single">
          <section className="card stack note-card note-card-wide">
            <h2>Follow-up session</h2>
            <div className="note-form-grid">
              <NoteTextarea
                label="Subjective update"
                name="subjective_update"
                defaultValue={asString(content.subjective_update)}
                rows={4}
              />
              <label className="field">
                <span>NPRS</span>
                <input defaultValue={asString(content.nprs)} name="nprs" type="text" />
              </label>
              <NoteTextarea
                label="Response to previous treatment"
                name="response_to_previous_treatment"
                defaultValue={asString(content.response_to_previous_treatment)}
                rows={4}
              />
              <NoteTextarea
                label="Objective reassessment"
                name="objective_reassessment"
                defaultValue={asString(content.objective_reassessment)}
                rows={4}
              />
              <NoteTextarea
                label="Treatment today"
                name="treatment_today"
                defaultValue={asString(content.treatment_today)}
                rows={4}
              />
              <NoteTextarea
                label="Exercises or self-management"
                name="exercises_or_self_management"
                defaultValue={asString(content.exercises_or_self_management)}
                rows={4}
              />
              <NoteTextarea
                label="Progress against goal"
                name="progress_against_goal"
                defaultValue={asString(content.progress_against_goal)}
                rows={4}
              />
              <NoteTextarea label="Next plan" name="next_plan" defaultValue={asString(content.next_plan)} rows={4} />
            </div>
          </section>
        </div>
      ) : null}

      {note.note_type === "discharge" ? (
        <div className="note-grid note-grid-single">
          <section className="card stack note-card note-card-wide">
            <h2>Discharge summary</h2>
            <div className="note-form-grid">
              <NoteTextarea
                label="Presenting problem summary"
                name="presenting_problem_summary"
                defaultValue={asString(content.presenting_problem_summary)}
                rows={4}
              />
              <NoteTextarea
                label="Treatment course summary"
                name="treatment_course_summary"
                defaultValue={asString(content.treatment_course_summary)}
                rows={4}
              />
              <NoteTextarea label="Outcome" name="outcome" defaultValue={asString(content.outcome)} rows={4} />
              <NoteTextarea
                label="Final functional status"
                name="final_functional_status"
                defaultValue={asString(content.final_functional_status)}
                rows={4}
              />
              <NoteTextarea
                label="Advice on discharge"
                name="advice_on_discharge"
                defaultValue={asString(content.advice_on_discharge)}
                rows={4}
              />
              <NoteTextarea
                label="Follow-up recommendations"
                name="follow_up_recommendations"
                defaultValue={asString(content.follow_up_recommendations)}
                rows={4}
              />
            </div>
          </section>
        </div>
      ) : null}

      <div className="workspace-actions note-form-footer">
        <button className="button button-primary" disabled={pending} name="submitIntent" type="submit" value="save">
          {pending ? "Saving note..." : "Save note"}
        </button>
        {note.note_type === "follow_up" ? (
          <button
            className="button button-management"
            disabled={pending}
            name="submitIntent"
            type="submit"
            value="save_and_discharge"
          >
            {pending ? "Saving + preparing discharge..." : "Save + Discharge patient"}
          </button>
        ) : null}
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </div>
    </form>
  );
}
