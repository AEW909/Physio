import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { listDraftNotesForClinician } from "@/lib/notes/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function DraftNotesPage() {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const notes = await listDraftNotesForClinician(profile.id);
  const supabase = await createSupabaseServerClient();
  const patientIds = Array.from(new Set(notes.map((note) => note.patient_id)));
  const patientLookup = new Map<string, { first_name: string; last_name: string }>();

  if (patientIds.length) {
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .in("id", patientIds);

    if (error) {
      throw new Error(`Failed to load patients for draft notes: ${error.message}`);
    }

    ((data ?? []) as Array<{ id: string; first_name: string; last_name: string }>).forEach((patient) => {
      patientLookup.set(patient.id, patient);
    });
  }

  return (
    <AppShell
      title="Draft notes"
      description="Pick up unfinished notes quickly without hunting through treatment plans."
      profile={profile}
    >
      <section className="card stack">
        <div className="split-header">
          <div>
            <h2>Unfinished notes</h2>
            <p className="lede">
              {notes.length} draft note{notes.length === 1 ? "" : "s"} currently assigned to you.
            </p>
          </div>
          <Link className="button button-secondary" href="/dashboard">
            Back to dashboard
          </Link>
        </div>

        {notes.length ? (
          <div className="patient-list patient-list-scroll">
            {notes.map((note) => {
              const patient = patientLookup.get(note.patient_id);
              return (
                <Link className="patient-row" href={`/notes/${note.id}`} key={note.id}>
                  <div>
                    <h3>{note.title}</h3>
                    <p>
                      {patient ? `${patient.first_name} ${patient.last_name}` : "Patient unavailable"}
                    </p>
                  </div>
                  <div className="patient-row-meta">
                    <span className="status-pill">{note.note_type.replace("_", " ")}</span>
                    <span>{formatRelativeDate(note.updated_at)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="dashboard-empty-state">
            No unfinished notes at the moment. Completed records should stay out of this list and keep it easy to scan.
          </p>
        )}
      </section>
    </AppShell>
  );
}
