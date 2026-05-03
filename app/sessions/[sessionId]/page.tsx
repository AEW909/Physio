import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAppointment } from "@/lib/appointments/queries";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { listNotesForAppointment } from "@/lib/notes/queries";
import { getPatient } from "@/lib/patients/queries";

type SessionDetailPageProps = {
  params: Promise<{ sessionId: string }>;
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { sessionId } = await params;
  const session = await getAppointment(sessionId);
  const patient = await getPatient(session.patient_id);
  const notes = await listNotesForAppointment(session.id);

  if (notes[0]) {
    redirect(`/notes/${notes[0].id}`);
  }

  return (
    <AppShell
      title={session.appointment_type}
      description="Session record created without a linked note. This should be unusual, but the session remains reviewable."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href={`/patients/${patient.id}`}>
          Back to patient
        </Link>
      </div>

      <section className="card stack">
        <h2>Session overview</h2>
        <dl className="detail-list">
          <div>
            <dt>Patient</dt>
            <dd>
              {patient.first_name} {patient.last_name}
            </dd>
          </div>
          <div>
            <dt>Date and time</dt>
            <dd>{formatDateTime(session.scheduled_at)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{session.status.replace("_", " ")}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{session.location || "Not recorded"}</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
