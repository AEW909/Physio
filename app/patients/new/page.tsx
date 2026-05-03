import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PatientForm } from "@/components/patients/patient-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";

export default async function NewPatientPage() {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  return (
    <AppShell
      title="Register patient"
      description="Create a patient record with persistent medical history that sits outside appointment-specific notes."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href="/patients">
          Back to patients
        </Link>
      </div>
      <section className="card stack">
        <PatientForm mode="create" />
      </section>
    </AppShell>
  );
}
