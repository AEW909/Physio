import type { PatientDetail } from "@/lib/patients/types";

type PatientSummaryProps = {
  patient: PatientDetail;
};

function formatDate(date: string | null) {
  if (!date) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function PatientSummary({ patient }: PatientSummaryProps) {
  return (
    <div className="detail-grid">
      <section className="card stack">
        <h2>Patient overview</h2>
        <dl className="detail-list">
          <div>
            <dt>Name</dt>
            <dd>
              {patient.first_name} {patient.last_name}
            </dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{formatDate(patient.date_of_birth)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{patient.email || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{patient.phone || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Consent status</dt>
            <dd>{patient.consent_status || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Archive status</dt>
            <dd>{patient.is_archived ? "Archived" : "Active"}</dd>
          </div>
        </dl>
      </section>

      <section className="card stack">
        <h2>Clinical and contact context</h2>
        <dl className="detail-list">
          <div>
            <dt>Address</dt>
            <dd>{patient.address || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Emergency contact</dt>
            <dd>
              {patient.emergency_contact_name || "Not recorded"}
              {patient.emergency_contact_phone
                ? ` (${patient.emergency_contact_phone})`
                : ""}
            </dd>
          </div>
          <div>
            <dt>GP</dt>
            <dd>
              {patient.gp_name || "Not recorded"}
              {patient.gp_contact ? ` (${patient.gp_contact})` : ""}
            </dd>
          </div>
          <div>
            <dt>Medication history</dt>
            <dd>{patient.drug_history || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Medication flags</dt>
            <dd>
              {[
                patient.uses_steroids ? "Steroids" : null,
                patient.uses_anticoagulants ? "Anticoagulants" : null,
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"}
            </dd>
          </div>
          <div>
            <dt>Past medical history</dt>
            <dd>
              {patient.past_medical_history?.length
                ? patient.past_medical_history.join(", ")
                : "None recorded"}
            </dd>
          </div>
          <div>
            <dt>Further details</dt>
            <dd>{patient.past_medical_history_details || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Past operations</dt>
            <dd>{patient.past_operations || "Not recorded"}</dd>
          </div>
          <div>
            <dt>Record created</dt>
            <dd>{formatDateTime(patient.created_at)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDateTime(patient.updated_at)}</dd>
          </div>
          <div>
            <dt>Archived at</dt>
            <dd>{patient.archived_at ? formatDateTime(patient.archived_at) : "Not archived"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
