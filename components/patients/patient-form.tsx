"use client";

import { useActionState } from "react";
import { type CreatePatientState, createPatientAction, updatePatientAction } from "@/app/patients/actions";
import { PAST_MEDICAL_HISTORY_OPTIONS } from "@/lib/patients/constants";
import type { PatientDetail } from "@/lib/patients/types";

type PatientFormProps = {
  mode: "create" | "edit";
  patient?: PatientDetail;
};

const initialState: CreatePatientState = {
  error: "",
};

export function PatientForm({ mode, patient }: PatientFormProps) {
  const action = mode === "create" ? createPatientAction : updatePatientAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedHistory = new Set(patient?.past_medical_history ?? []);

  return (
    <form className="patient-form" action={formAction}>
      {patient ? <input type="hidden" name="patientId" value={patient.id} /> : null}

      <div className="patient-form-grid">
        <label className="field">
          <span>First name</span>
          <input name="firstName" type="text" defaultValue={patient?.first_name ?? ""} required />
        </label>

        <label className="field">
          <span>Last name</span>
          <input name="lastName" type="text" defaultValue={patient?.last_name ?? ""} required />
        </label>

        <label className="field">
          <span>Date of birth</span>
          <input name="dateOfBirth" type="date" defaultValue={patient?.date_of_birth ?? ""} />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={patient?.email ?? ""}
          />
        </label>

        <label className="field">
          <span>Phone</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={patient?.phone ?? ""}
          />
        </label>

        <label className="field">
          <span>Consent status</span>
          <input
            name="consentStatus"
            type="text"
            placeholder="Verbal consent confirmed"
            defaultValue={patient?.consent_status ?? ""}
          />
        </label>

        <label className="field field-full">
          <span>Address</span>
          <textarea name="address" rows={3} defaultValue={patient?.address ?? ""} />
        </label>

        <label className="field">
          <span>Emergency contact name</span>
          <input
            name="emergencyContactName"
            type="text"
            defaultValue={patient?.emergency_contact_name ?? ""}
          />
        </label>

        <label className="field">
          <span>Emergency contact phone</span>
          <input
            name="emergencyContactPhone"
            type="tel"
            defaultValue={patient?.emergency_contact_phone ?? ""}
          />
        </label>

        <label className="field">
          <span>GP name</span>
          <input name="gpName" type="text" defaultValue={patient?.gp_name ?? ""} />
        </label>

        <label className="field">
          <span>GP contact</span>
          <input name="gpContact" type="text" defaultValue={patient?.gp_contact ?? ""} />
        </label>

        <fieldset className="checkbox-panel">
          <legend>Drug history flags</legend>
          <div className="checkbox-grid checkbox-grid-compact">
            <label className="checkbox-item">
              <input
                defaultChecked={patient?.uses_steroids ?? false}
                name="usesSteroids"
                type="checkbox"
                value="yes"
              />
              <span>Steroids</span>
            </label>
            <label className="checkbox-item">
              <input
                defaultChecked={patient?.uses_anticoagulants ?? false}
                name="usesAnticoagulants"
                type="checkbox"
                value="yes"
              />
              <span>Anticoagulants</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="checkbox-panel field-full">
          <legend>Past medical history</legend>
          <div className="checkbox-grid">
            {PAST_MEDICAL_HISTORY_OPTIONS.map((option) => (
              <label className="checkbox-item" key={option}>
                <input
                  name="pastMedicalHistory"
                  type="checkbox"
                  value={option}
                  defaultChecked={selectedHistory.has(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field field-full">
          <span>Drug history</span>
          <textarea
            name="drugHistory"
            rows={3}
            placeholder="List current relevant medications."
            defaultValue={patient?.drug_history ?? ""}
          />
        </label>

        <label className="field field-full">
          <span>Further details</span>
          <textarea
            name="pastMedicalHistoryDetails"
            rows={4}
            placeholder="Add any relevant detail about the selected conditions, medications, precautions, or risks."
            defaultValue={patient?.past_medical_history_details ?? ""}
          />
        </label>

        <label className="field field-full">
          <span>Past operations</span>
          <textarea
            name="pastOperations"
            rows={4}
            placeholder="List relevant operations or surgical history."
            defaultValue={patient?.past_operations ?? ""}
          />
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending
          ? mode === "create"
            ? "Creating patient..."
            : "Saving changes..."
          : mode === "create"
            ? "Create patient record"
            : "Save patient changes"}
      </button>
    </form>
  );
}
