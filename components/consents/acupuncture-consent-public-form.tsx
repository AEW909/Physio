"use client";

import { useActionState } from "react";
import { submitAcupunctureConsentAction, type AcupunctureConsentSubmitState } from "@/app/acupuncture-consents/actions";

type AcupunctureConsentPublicFormProps = {
  token: string;
  patientName: string;
  dateOfBirth: string | null;
  alreadySubmitted: boolean;
};

const initialState: AcupunctureConsentSubmitState = {};

export function AcupunctureConsentPublicForm({
  token,
  patientName,
  dateOfBirth,
  alreadySubmitted,
}: AcupunctureConsentPublicFormProps) {
  const [state, formAction, pending] = useActionState(submitAcupunctureConsentAction, initialState);

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="token" value={token} />

      <section className="card stack">
        <div>
          <p className="eyebrow">Acupuncture consent</p>
          <h1>{patientName}</h1>
          <p className="lede">
            Please complete this form before acupuncture treatment. Your clinician will review the information before proceeding.
          </p>
        </div>

        <div className="patient-form-grid">
          <label className="field">
            <span>Full name</span>
            <input
              name="patientFullName"
              type="text"
              defaultValue={patientName}
              required
              disabled={alreadySubmitted}
            />
          </label>
          <label className="field">
            <span>Date of birth</span>
            <input
              name="patientDateOfBirth"
              type="date"
              defaultValue={dateOfBirth ?? ""}
              required
              disabled={alreadySubmitted}
            />
          </label>
        </div>
      </section>

      <section className="card stack">
        <h2>Before you consent</h2>
        <p className="lede">
          Acupuncture has been explained to me, including likely benefits, common short-term effects such as bruising,
          bleeding, soreness, fatigue, or dizziness, and the rare possibility of feeling faint.
        </p>

        <label className="consent-check">
          <input name="understandsTreatment" type="checkbox" disabled={alreadySubmitted} />
          <span>I confirm that the acupuncture treatment has been explained to me.</span>
        </label>

        <label className="consent-check">
          <input name="understandsRisks" type="checkbox" disabled={alreadySubmitted} />
          <span>I understand the common risks and expected short-term effects of acupuncture.</span>
        </label>

        <label className="consent-check">
          <input name="disclosedRelevantHistory" type="checkbox" disabled={alreadySubmitted} />
          <span>I have disclosed relevant medical history, medication, pregnancy status, or other concerns that may affect treatment.</span>
        </label>

        <label className="field field-full">
          <span>Relevant history or concerns</span>
          <textarea
            name="historyNotes"
            rows={5}
            placeholder="Add anything you want the clinician to be aware of before treatment proceeds."
            disabled={alreadySubmitted}
          />
        </label>
      </section>

      <section className="card stack">
        <h2>Consent</h2>
        <label className="consent-check">
          <input name="consentToTreatment" type="checkbox" disabled={alreadySubmitted} />
          <span>I consent to acupuncture treatment, subject to clinician review of this completed form.</span>
        </label>

        <label className="field">
          <span>Typed signature</span>
          <input
            name="signatureName"
            type="text"
            placeholder="Type your full name"
            defaultValue={patientName}
            required
            disabled={alreadySubmitted}
          />
        </label>
      </section>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}

      {!alreadySubmitted ? (
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Submitting consent..." : "Submit consent form"}
        </button>
      ) : (
        <p className="form-success">
          This consent form has already been submitted. If anything needs changing, please contact the clinic.
        </p>
      )}
    </form>
  );
}
