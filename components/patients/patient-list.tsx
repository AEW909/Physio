import Link from "next/link";
import type { PatientListItem } from "@/lib/patients/types";

type PatientListProps = {
  searchTerm: string;
  patients: PatientListItem[];
  status: "active" | "archived";
};

function formatDob(dateOfBirth: string | null) {
  if (!dateOfBirth) return "DOB not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateOfBirth));
}

export function PatientList({ patients, searchTerm, status }: PatientListProps) {
  if (!patients.length) {
    return (
      <article className="card">
        <h2>
          {searchTerm
            ? "No matching patients"
            : status === "archived"
              ? "No archived patients"
              : "No patient records yet"}
        </h2>
        <p>
          {searchTerm
            ? "Try a broader search, or add a new patient if they have not been registered yet."
            : status === "archived"
              ? "Archived patients will appear here when records are retired from the active directory."
              : "Add the first patient record to start building the directory."}
        </p>
      </article>
    );
  }

  return (
    <section className="card stack">
      <div className="split-header">
        <div>
          <h2>Patient directory</h2>
          <p className="lede">
            {patients.length} {status === "archived" ? "archived " : ""}patient record
            {patients.length === 1 ? "" : "s"} in this view.
          </p>
        </div>
      </div>

      <div className="patient-list">
        {patients.map((patient) => (
          <Link className="patient-row" href={`/patients/${patient.id}`} key={patient.id}>
            <div>
              <h3>
                {patient.first_name} {patient.last_name}
              </h3>
              <p>{formatDob(patient.date_of_birth)}</p>
            </div>
            <div className="patient-row-meta">
              <span>{patient.email || "No email"}</span>
              <span>{patient.phone || "No phone"}</span>
              {patient.is_archived && patient.archived_at ? (
                <span>Archived {new Date(patient.archived_at).toLocaleDateString("en-GB")}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
