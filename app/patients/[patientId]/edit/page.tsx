import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PatientForm } from "@/components/patients/patient-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";

type EditPatientPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { patientId } = await params;
  const patient = await getPatient(patientId);

  return (
    <AppShell
      title={`Edit ${patient.first_name} ${patient.last_name}`}
      description="Update the standing patient record, including medical history and operation history, without mixing it into session notes."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href={`/patients/${patient.id}`}>
          Back to patient
        </Link>
      </div>
      <section className="card stack">
        <PatientForm mode="edit" patient={patient} />
      </section>
    </AppShell>
  );
}
