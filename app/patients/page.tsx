import { AppShell } from "@/components/layout/app-shell";
import { PatientList } from "@/components/patients/patient-list";
import { PatientSearch } from "@/components/patients/patient-search";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { listPatients } from "@/lib/patients/queries";
import Link from "next/link";

type PatientsPageProps = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status === "archived" ? "archived" : "active";
  const patients = await listPatients(search, status);

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  return (
    <AppShell
      title="Patients"
      description="Search and manage patient records. Registration and updates live here, separate from appointment-level clinical notes."
      profile={profile}
    >
      <div className="workspace-actions workspace-actions-spread">
        <PatientSearch initialQuery={search} />
        <div className="workspace-actions">
          <Link
            className="button button-secondary"
            href={status === "archived" ? "/patients" : "/patients?status=archived"}
          >
            {status === "archived" ? "View active patients" : "View archived patients"}
          </Link>
          <Link className="button button-primary" href="/patients/new">
            Add patient
          </Link>
        </div>
      </div>
      <PatientList patients={patients} searchTerm={search} status={status} />
    </AppShell>
  );
}
