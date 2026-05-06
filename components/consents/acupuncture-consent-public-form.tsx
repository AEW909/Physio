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

const healthQuestions = [
  { name: "diabetesResponse", label: "Do you suffer from diabetes?" },
  { name: "epilepticSeizureResponse", label: "Have you ever experienced an epileptic seizure?" },
  { name: "faintedResponse", label: "Have you ever fainted?" },
  { name: "heartProblemResponse", label: "Do you have any heart problems?" },
  { name: "pacemakerResponse", label: "Do you have a pacemaker or any other electrical implant?" },
  {
    name: "circulationProblemResponse",
    label:
      "Do you have any problems with your circulation such as deep vein thrombosis, pulmonary embolism, or a bleeding/clotting disorder?",
  },
  { name: "anticoagulationResponse", label: "Are you receiving anticoagulation therapy?" },
  { name: "cancerResponse", label: "Do you have, or have you ever had, any form of cancer?" },
  { name: "bloodBorneVirusResponse", label: "Are you aware of any blood borne viruses such as HIV, AIDS, or Hepatitis?" },
  { name: "allergyResponse", label: "Do you have any allergies, specifically to metal or alcohol wipes?" },
  { name: "pregnantResponse", label: "Are you pregnant or trying to conceive?" },
  { name: "needlePhobiaResponse", label: "Do you have a phobia of needles?" },
  {
    name: "priorNeedlingAdverseEffectResponse",
    label: "Have you ever experienced an adverse effect from previous needling procedures such as acupuncture or injections?",
  },
  { name: "eatenWithinTwoHoursResponse", label: "Have you eaten, or will you eat, within 2 hours prior to your acupuncture treatment?" },
] as const;

function YesNoField({
  disabled,
  label,
  name,
}: {
  disabled: boolean;
  label: string;
  name: string;
}) {
  return (
    <div className="consent-question-row">
      <p>{label}</p>
      <div className="consent-question-choice">
        <label className="consent-radio">
          <input disabled={disabled} name={name} required type="radio" value="yes" />
          <span>Yes</span>
        </label>
        <label className="consent-radio">
          <input disabled={disabled} name={name} required type="radio" value="no" />
          <span>No</span>
        </label>
      </div>
    </div>
  );
}

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
            Please complete this consent and health screening form before acupuncture treatment. Your clinician will
            review the information before proceeding.
          </p>
        </div>

        <div className="patient-form-grid">
          <label className="field">
            <span>Patient name</span>
            <input
              name="patientFullName"
              type="text"
              defaultValue={patientName}
              required
              disabled={alreadySubmitted}
            />
          </label>
          <label className="field">
            <span>Patient DOB</span>
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
        <h2>Acupuncture in physiotherapy consent form</h2>

        <div className="consent-copy-grid">
          <div className="consent-copy-card">
            <h3>Intended benefits of treatment</h3>
            <ul className="consent-copy-list">
              <li>Reduction of pain</li>
              <li>Alleviation of muscle spasm and tension</li>
              <li>Facilitation of the healing process</li>
              <li>Induction of local and general relaxation</li>
              <li>Promotion of general well-being</li>
              <li>Improvement of sleep pattern</li>
            </ul>
          </div>

          <div className="consent-copy-card">
            <h3>Possible adverse effects</h3>
            <ul className="consent-copy-list">
              <li>Bleeding and bruising (3%)</li>
              <li>Mild aggravation of symptoms (3%, of which 70-85% show subsequent improvement)</li>
              <li>Mild pain at the needle site (1%)</li>
              <li>Drowsiness (1%)</li>
              <li>Dizziness (0.6%)</li>
              <li>Pain not at needle site (0.5%)</li>
              <li>Nausea (0.3%)</li>
              <li>Feeling faint (0.3%)</li>
              <li>Stuck or bent needle (0.1%)</li>
              <li>Headache (0.1%)</li>
              <li>Allergy or infection (up to 0.2%)</li>
              <li>Pneumothorax (0.0002%, less than 2 per 1 million)</li>
            </ul>
          </div>
        </div>

        <p className="lede">
          If you experience any of the above or notice anything unusual about your health following treatment, you should contact your physiotherapist or GP straight away.
        </p>

        <label className="consent-check">
          <input name="understandsTreatment" type="checkbox" disabled={alreadySubmitted} />
          <span>I confirm the acupuncture treatment has been explained to me and I understand the intended benefits.</span>
        </label>

        <label className="consent-check">
          <input name="understandsRisks" type="checkbox" disabled={alreadySubmitted} />
          <span>I understand the possible adverse effects and have had the opportunity to ask questions.</span>
        </label>

        <label className="consent-check">
          <input name="consentToTreatment" type="checkbox" disabled={alreadySubmitted} />
          <span>
            I give consent to acupuncture treatment. I understand I can withdraw from treatment at any time and agree not to disturb the needles during treatment, asking for assistance if I have any concern.
          </span>
        </label>
      </section>

      <section className="card stack">
        <h2>Acupuncture in physiotherapy health screening form</h2>
        <p className="lede">
          Please answer the following questions honestly and to the best of your ability so your clinician can assess any enhanced risk before treatment.
        </p>

        <div className="consent-question-list">
          {healthQuestions.map((question) => (
            <YesNoField
              disabled={alreadySubmitted}
              key={question.name}
              label={question.label}
              name={question.name}
            />
          ))}
        </div>

        <label className="field field-full">
          <span>Further information</span>
          <textarea
            name="screeningNotes"
            rows={5}
            placeholder="Add any extra health details that may be relevant before treatment."
            disabled={alreadySubmitted}
          />
        </label>

        <label className="consent-check">
          <input name="disclosedRelevantHistory" type="checkbox" disabled={alreadySubmitted} />
          <span>I confirm I have answered the screening questions honestly and to the best of my knowledge.</span>
        </label>

        <label className="field field-full">
          <span>Relevant history or concerns for the clinician</span>
          <textarea
            name="historyNotes"
            rows={4}
            placeholder="Add anything else you want your clinician to be aware of before treatment proceeds."
            disabled={alreadySubmitted}
          />
        </label>
      </section>

      <section className="card stack">
        <h2>Patient declaration</h2>
        <p className="lede">
          I know of no reason that I should not have acupuncture treatment and I am submitting this form for clinician review.
        </p>

        <label className="field">
          <span>Patient name (print in full)</span>
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
