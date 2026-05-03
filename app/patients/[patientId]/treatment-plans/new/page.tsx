import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CreateTreatmentPlanForm } from "@/components/treatment-plans/create-treatment-plan-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";

type NewTreatmentPlanPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function NewTreatmentPlanPage({ params }: NewTreatmentPlanPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { patientId } = await params;
  const patient = await getPatient(patientId);

  return (
    <AppShell
      title={`New treatment plan for ${patient.first_name} ${patient.last_name}`}
      description="Create the plan first, then start its initial assessment as the first full session."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href={`/patients/${patient.id}`}>
          Back to patient
        </Link>
      </div>

      <section className="card stack">
        <CreateTreatmentPlanForm patientId={patient.id} />
      </section>
    </AppShell>
  );
}
