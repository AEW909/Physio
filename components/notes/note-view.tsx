"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { updateNoteAction } from "@/app/notes/actions";
import {
  CERVICAL_QUESTION_OPTIONS,
  GOAL_OPTIONS,
  INVESTIGATION_OPTIONS,
  MODALITY_OPTIONS,
  ONSET_PATTERN_OPTIONS,
  SPECIAL_QUESTION_OPTIONS,
  SYMPTOM_FEATURE_OPTIONS,
} from "@/lib/notes/templates";
import { PAST_MEDICAL_HISTORY_OPTIONS } from "@/lib/patients/constants";
import type { ClinicalNoteDetail } from "@/lib/notes/types";
import type { PatientDetail } from "@/lib/patients/types";

type NoteViewProps = {
  note: ClinicalNoteDetail;
  patient: PatientDetail;
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

function getLegacyGoalValues(source: Record<string, unknown>) {
  return {
    reduce_pain: asBoolean(source.reduce_pain),
    improve_function: asBoolean(source.improve_function),
    increase_rom: asBoolean(source.increase_rom),
    return_to_work: asBoolean(source.return_to_work),
    return_to_sport_or_hobby: asBoolean(source.return_to_sport_or_hobby),
  };
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
  autoFocus = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea autoFocus={autoFocus} defaultValue={defaultValue} name={name} rows={rows} />
    </label>
  );
}

function SectionJumpNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label="Note sections" className="note-jump-nav">
      {links.map((link) => (
        <a className="note-jump-link" href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function NprsSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="select-field" defaultValue={defaultValue} name={name}>
        <option value="">Not recorded</option>
        {Array.from({ length: 11 }, (_, value) => (
          <option key={value} value={String(value)}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryPrompt({
  heading,
  text,
}: {
  heading: string;
  text: string;
}) {
  return (
    <div className="note-prompt-block">
      <strong>{heading}</strong>
      <span>{text}</span>
    </div>
  );
}

export function NoteView({ note, patient }: NoteViewProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateNoteAction, initialState);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const isSubmittingRef = useRef(false);
  const content = asRecord(note.current_version?.content ?? {});
  const history = asRecord(content.history);
  const medicalHistory = asRecord(content.medical_history);
  const specialQuestions = asRecord(content.special_questions);
  const cervicalQuestions = asRecord(content.cervical_questions);
  const objective = asRecord(content.objective);
  const impression = asRecord(content.impression);
  const plan = asRecord(content.plan);
  const modalities = asRecord(plan.modalities);
  const goals = Object.keys(asRecord(plan.goals)).length ? asRecord(plan.goals) : getLegacyGoalValues(modalities);
  const selectedMedicalHistory = new Set(
    asStringArray(medicalHistory.past_medical_history).length
      ? asStringArray(medicalHistory.past_medical_history)
      : patient.past_medical_history ?? [],
  );
  const patternFactors =
    asString(history.pattern_factors) ||
    [asString(history.diurnal_pattern), asString(history.aggs), asString(history.ease)].filter(Boolean).join("\n");
  const neuroScreen =
    asString(objective.neuro_screen) ||
    [
      asString(objective.myotomes) && `Myotomes: ${asString(objective.myotomes)}`,
      asString(objective.dermatomes) && `Dermatomes: ${asString(objective.dermatomes)}`,
      asString(objective.reflexes) && `Reflexes: ${asString(objective.reflexes)}`,
      asString(objective.slr) && `SLR: ${asString(objective.slr)}`,
    ]
      .filter(Boolean)
      .join("\n");
  const nprsBest = asString(history.nprs_best);
  const nprsCurrent = asString(history.nprs_current) || asString(history.nprs);
  const nprsWorst = asString(history.nprs_worst);

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLButtonElement) return;
    if (target instanceof HTMLInputElement) {
      const type = target.type.toLowerCase();
      if (["submit", "button", "checkbox", "radio"].includes(type)) {
        return;
      }
    }

    event.preventDefault();
  }

  function markDirty() {
    if (!isSubmittingRef.current) {
      setIsDirty(true);
    }
  }

  function handleSubmit() {
    isSubmittingRef.current = true;
    setIsDirty(false);
    setPendingNavigationHref(null);
  }

  function stayOnPage() {
    setPendingNavigationHref(null);
  }

  function leavePage() {
    if (!pendingNavigationHref) return;
    const href = pendingNavigationHref;
    isSubmittingRef.current = true;
    setIsDirty(false);
    setPendingNavigationHref(null);

    if (href.startsWith("/")) {
      router.push(href);
      return;
    }

    window.location.assign(href);
  }

  useEffect(() => {
    if (!pending) {
      isSubmittingRef.current = false;
    }
  }, [pending]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!isDirty || isSubmittingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const clickHandler = (event: MouseEvent) => {
      if (!isDirty || isSubmittingRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.getAttribute("target") === "_blank") return;

      event.preventDefault();
      setPendingNavigationHref(href);
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    document.addEventListener("click", clickHandler, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      document.removeEventListener("click", clickHandler, true);
    };
  }, [isDirty]);

  return (
    <>
      {hasMounted && pendingNavigationHref
        ? createPortal(
            <div className="modal-backdrop" role="presentation">
              <div
                aria-describedby="unsaved-note-warning-description"
                aria-labelledby="unsaved-note-warning-title"
                aria-modal="true"
                className="modal-card"
                role="dialog"
              >
                <p className="eyebrow">Harris Physiotherapy</p>
                <h2 id="unsaved-note-warning-title">Unsaved note changes</h2>
                <p className="lede" id="unsaved-note-warning-description">
                  This note has unsaved changes. If you leave now, those edits will be lost.
                </p>
                <div className="workspace-actions">
                  <button className="button button-secondary" onClick={stayOnPage} type="button">
                    Stay on this note
                  </button>
                  <button className="button button-management" onClick={leavePage} type="button">
                    Leave without saving
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <form
        action={formAction}
        className="note-form"
        onChange={markDirty}
        onInput={markDirty}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      >
        <input name="noteId" type="hidden" value={note.id} />
        <input name="noteType" type="hidden" value={note.note_type} />
        <input name="treatmentPlanId" type="hidden" value={note.treatment_plan_id ?? ""} />

        {note.note_type !== "initial_assessment" ? (
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
        ) : null}

      {note.note_type === "initial_assessment" ? (
        <>
          <SectionJumpNav
            links={[
              { href: "#medical-history", label: "Medical history" },
              { href: "#subjective-history", label: "Subjective" },
              { href: "#objective-examination", label: "Objective" },
              { href: "#impression", label: "Impression" },
              { href: "#treatment-plan", label: "Plan" },
            ]}
          />
          <div className="note-grid">
            <details className="note-section-panel card stack note-card note-card-wide" id="medical-history">
              <summary className="note-section-summary">
                <div className="note-section-toggle-wrap">
                  <span aria-hidden="true" className="note-section-toggle-icon" />
                </div>
                <div>
                  <h2>Medical history and medications</h2>
                  <p>Check and update this at the start of the initial consultation. The latest version feeds the patient record summary.</p>
                  {selectedMedicalHistory.size || patient.uses_steroids || patient.uses_anticoagulants || patient.drug_history || patient.past_operations ? (
                    <span className="status-pill status-pill-flag">History on record</span>
                  ) : null}
                </div>
              </summary>
              <div className="note-section-body stack">
                <div className="note-prompt-grid">
                  <SummaryPrompt heading="Quick reminder" text="Confirm medications, PMH, operations, and relevant precautions before continuing." />
                </div>
                <fieldset className="checkbox-panel field-full">
                  <legend>Past medical history</legend>
                  <div className="checkbox-grid">
                    {PAST_MEDICAL_HISTORY_OPTIONS.map((option) => (
                      <label className="checkbox-item" key={option}>
                        <input
                          name="medical_history.past_medical_history"
                          type="checkbox"
                          value={option}
                          defaultChecked={selectedMedicalHistory.has(option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="note-form-grid">
                  <fieldset className="checkbox-panel">
                    <legend>Drug flags</legend>
                    <div className="checkbox-grid checkbox-grid-compact">
                      <label className="checkbox-item">
                        <input
                          defaultChecked={
                            asBoolean(medicalHistory.uses_steroids) || patient.uses_steroids
                          }
                          name="medical_history.uses_steroids"
                          type="checkbox"
                        />
                        <span>Steroids</span>
                      </label>
                      <label className="checkbox-item">
                        <input
                          defaultChecked={
                            asBoolean(medicalHistory.uses_anticoagulants) || patient.uses_anticoagulants
                          }
                          name="medical_history.uses_anticoagulants"
                          type="checkbox"
                        />
                        <span>Anticoagulants</span>
                      </label>
                    </div>
                  </fieldset>
                  <NoteTextarea
                    label="Drug history"
                    name="medical_history.drug_history"
                    defaultValue={asString(medicalHistory.drug_history) || (patient.drug_history ?? "")}
                    rows={4}
                  />
                  <NoteTextarea
                    label="Further details"
                    name="medical_history.past_medical_history_details"
                    defaultValue={
                      asString(medicalHistory.past_medical_history_details) || (patient.past_medical_history_details ?? "")
                    }
                    rows={4}
                  />
                  <NoteTextarea
                    label="Past operations"
                    name="medical_history.past_operations"
                    defaultValue={asString(medicalHistory.past_operations) || (patient.past_operations ?? "")}
                    rows={4}
                  />
                </div>
              </div>
            </details>

            <details className="note-section-panel card stack note-card note-card-wide" id="subjective-history">
              <summary className="note-section-summary">
                <div className="note-section-toggle-wrap">
                  <span aria-hidden="true" className="note-section-toggle-icon" />
                </div>
                <div>
                  <h2>Subjective history</h2>
                  <p>History, symptom profile, special questions, and cervical-specific prompts.</p>
                </div>
              </summary>
              <div className="note-section-body stack">
                <div className="note-form-grid">
                  <NoteTextarea autoFocus label="HPC" name="history.hpc" defaultValue={asString(history.hpc)} rows={5} />
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
                  <div className="note-form-grid note-form-grid-nprs">
                    <NprsSelect label="NPRS best" name="history.nprs_best" defaultValue={nprsBest} />
                    <NprsSelect label="NPRS current" name="history.nprs_current" defaultValue={nprsCurrent} />
                    <NprsSelect label="NPRS worst" name="history.nprs_worst" defaultValue={nprsWorst} />
                  </div>
                  <NoteTextarea
                    label="Pattern, aggravating and easing factors"
                    name="history.pattern_factors"
                    defaultValue={patternFactors}
                    rows={4}
                  />
                </div>
                <div className="note-form-grid">
                  <BooleanGrid
                    legend="Red flags and special questions"
                    prefix="special_questions"
                    options={SPECIAL_QUESTION_OPTIONS}
                    values={specialQuestions}
                  />
                  <BooleanGrid
                    legend="Cervical questions"
                    prefix="cervical_questions"
                    options={CERVICAL_QUESTION_OPTIONS}
                    values={cervicalQuestions}
                  />
                </div>
              </div>
            </details>

            <details className="note-section-panel card stack note-card note-card-wide" id="objective-examination">
              <summary className="note-section-summary">
                <div className="note-section-toggle-wrap">
                  <span aria-hidden="true" className="note-section-toggle-icon" />
                </div>
                <div>
                  <h2>Objective examination</h2>
                  <p>Range, tests, palpation, and neurological findings.</p>
                </div>
              </summary>
              <div className="note-section-body">
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
                  <NoteTextarea
                    label="Neurological screen"
                    name="objective.neuro_screen"
                    defaultValue={neuroScreen}
                    rows={4}
                  />
                  <NoteTextarea label="Other" name="objective.other" defaultValue={asString(objective.other)} rows={3} />
                </div>
              </div>
            </details>

          <section className="card stack note-card note-card-wide" id="impression">
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

            <details className="note-section-panel card stack note-card note-card-wide" id="treatment-plan">
              <summary className="note-section-summary">
                <div className="note-section-toggle-wrap">
                  <span aria-hidden="true" className="note-section-toggle-icon" />
                </div>
                <div>
                  <h2>Plan</h2>
                  <p>Goals, treatment approach, and what was actually done today.</p>
                </div>
              </summary>
              <div className="note-section-body">
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
                  <div className="note-form-grid">
                    <BooleanGrid legend="Goals" prefix="plan.goals" options={GOAL_OPTIONS} values={goals} />
                    <BooleanGrid legend="Modalities" prefix="plan.modalities" options={MODALITY_OPTIONS} values={modalities} />
                  </div>
                  <NoteTextarea
                    label="Actual treatment given"
                    name="plan.actual_treatment_given"
                    defaultValue={asString(plan.actual_treatment_given)}
                    rows={4}
                  />
                  <NoteTextarea
                    label="Modality notes"
                    name="plan.modality_notes"
                    defaultValue={asString(plan.modality_notes)}
                    rows={4}
                  />
                </div>
              </div>
            </details>
          </div>
        </>
      ) : null}

      {note.note_type === "follow_up" ? (
        <>
          <SectionJumpNav
            links={[
              { href: "#follow-up-session", label: "Follow-up note" },
              { href: "#note-actions", label: "Save actions" },
            ]}
          />
          <div className="note-grid note-grid-single">
          <section className="card stack note-card note-card-wide" id="follow-up-session">
            <h2>Follow-up session</h2>
            <div className="note-form-grid">
              <NoteTextarea
                autoFocus
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
        </>
      ) : null}

      {note.note_type === "discharge" ? (
        <>
          <SectionJumpNav
            links={[
              { href: "#discharge-summary", label: "Discharge note" },
              { href: "#note-actions", label: "Save actions" },
            ]}
          />
          <div className="note-grid note-grid-single">
          <section className="card stack note-card note-card-wide" id="discharge-summary">
            <h2>Discharge summary</h2>
            <div className="note-form-grid">
              <NoteTextarea
                autoFocus
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
        </>
      ) : null}

        <div className="workspace-actions note-form-footer note-form-footer-sticky" id="note-actions">
          <button className="button button-primary" disabled={pending} name="submitIntent" type="submit" value="save">
            {pending ? "Saving note..." : "Save note"}
          </button>
          {note.note_type === "initial_assessment" ? (
            <button
              className="button button-secondary"
              disabled={pending}
              name="submitIntent"
              type="submit"
              value="save_and_generate_plan_summaries"
            >
              {pending ? "Saving + generating AI summaries..." : "Save + Generate AI summaries"}
            </button>
          ) : null}
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
      </form>
    </>
  );
}
