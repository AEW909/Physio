import { AppShell } from "@/components/layout/app-shell";
import { PatientList } from "@/components/patients/patient-list";
import { PatientSearch } from "@/components/patients/patient-search";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";
import { listPatients } from "@/lib/patients/queries";
import Link from "next/link";

type PatientsPageProps = {
  searchParams: Promise<{ search?: string; status?: string; sort?: string }>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status === "archived" ? "archived" : "active";
  const sort = params.sort === "last_seen" ? "last_seen" : "surname";
  const patients = await listPatients(search, status, sort);

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  function buildPatientsHref(nextStatus: "active" | "archived", nextSort = sort) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (nextStatus === "archived") query.set("status", "archived");
    if (nextSort !== "surname") query.set("sort", nextSort);
    const queryString = query.toString();
    return queryString ? `/patients?${queryString}` : "/patients";
  }

  return (
    <AppShell
      title="Patients"
      description="Search and manage patient records. Default view is alphabetical by surname, with a recent-clinic view when you need to work down the latest caseload."
      profile={profile}
    >
      <div className="workspace-actions workspace-actions-spread">
        <PatientSearch initialQuery={search} sort={sort} status={status} />
        <div className="workspace-actions">
          <Link
            className={`button ${sort === "surname" ? "button-primary" : "button-secondary"}`}
            href={buildPatientsHref(status, "surname")}
          >
            Sort by surname
          </Link>
          <Link
            className={`button ${sort === "last_seen" ? "button-primary" : "button-secondary"}`}
            href={buildPatientsHref(status, "last_seen")}
          >
            Sort by last seen
          </Link>
          <Link
            className="button button-secondary"
            href={status === "archived" ? buildPatientsHref("active") : buildPatientsHref("archived")}
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
