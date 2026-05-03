import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TreatmentPlanForm } from "@/components/treatment-plans/treatment-plan-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";
import { getTreatmentPlan } from "@/lib/treatment-plans/queries";

type EditTreatmentPlanPageProps = {
  params: Promise<{ planId: string }>;
  searchParams?: Promise<{ aiGenerated?: string }>;
};

export default async function EditTreatmentPlanPage({ params, searchParams }: EditTreatmentPlanPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { planId } = await params;
  const query = searchParams ? await searchParams : {};
  const plan = await getTreatmentPlan(planId);
  const patient = await getPatient(plan.patient_id);

  return (
    <AppShell
      title={`Edit ${plan.title}`}
      description="Update the treatment plan name, status, and high-level summaries clinicians use to track progress over time."
      profile={profile}
    >
      <div className="workspace-actions">
        <Link className="button button-secondary" href={`/treatment-plans/${plan.id}`}>
          Back to treatment plan
        </Link>
        <Link className="button button-secondary" href={`/patients/${patient.id}`}>
          Back to patient
        </Link>
      </div>

      <section className="card stack">
        {query.aiGenerated === "1" ? (
          <p className="form-success">
            AI starter summaries have been added. Review and edit them here before carrying on.
          </p>
        ) : null}
        <TreatmentPlanForm mode="edit" plan={plan} />
      </section>
    </AppShell>
  );
}
