import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ArchiveToggleForm } from "@/components/patients/archive-toggle-form";
import { PatientNextModuleSlots } from "@/components/patients/patient-next-module-slots";
import { PatientSummary } from "@/components/patients/patient-summary";
import { TreatmentPlanList } from "@/components/treatment-plans/treatment-plan-list";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { getPatient } from "@/lib/patients/queries";
import { listTreatmentPlansForPatient } from "@/lib/treatment-plans/queries";

type PatientDetailPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  const { patientId } = await params;
  const patient = await getPatient(patientId);
  const treatmentPlans = await listTreatmentPlansForPatient(patient.id, "active");
  const archivedTreatmentPlans = await listTreatmentPlansForPatient(patient.id, "archived");

  return (
    <AppShell
      title={`${patient.first_name} ${patient.last_name}`}
      description="Patient record details, treatment plans, screening, and document history."
      profile={profile}
    >
      <div className="workspace-actions workspace-actions-spread">
        <div className="workspace-actions">
          <Link className="button button-secondary" href="/patients">
            Back to patients
          </Link>
          <Link className="button button-primary" href={`/patients/${patient.id}/edit`}>
            Edit patient
          </Link>
          <Link className="button button-primary" href={`/patients/${patient.id}/treatment-plans/new`}>
            New treatment plan
          </Link>
        </div>
        {profile.role === "owner" || profile.role === "admin" ? (
          <ArchiveToggleForm isArchived={patient.is_archived} patientId={patient.id} />
        ) : null}
      </div>
      <PatientSummary patient={patient} />
      <TreatmentPlanList plans={treatmentPlans} />
      {archivedTreatmentPlans.length ? (
        <details className="plan-panel">
          <summary className="plan-summary-bar">
            <div className="plan-summary-main">
              <span aria-hidden="true" className="plan-toggle-icon" />
            </div>
            <div>
              <h3>Archived treatment plans</h3>
              <p>{archivedTreatmentPlans.length} archived treatment plan{archivedTreatmentPlans.length === 1 ? "" : "s"} hidden from the default view.</p>
            </div>
          </summary>
          <div className="plan-panel-body">
            <TreatmentPlanList
              description="Archived plans are kept out of the day-to-day workflow but remain available for reference or restore."
              plans={archivedTreatmentPlans}
              title="Archived treatment plans"
            />
          </div>
        </details>
      ) : null}
      <PatientNextModuleSlots />
    </AppShell>
  );
}
