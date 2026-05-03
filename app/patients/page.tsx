import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";

export default async function PatientsPage() {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  return (
    <AppShell
      title="Patients"
      description="This secured module will become the patient directory and patient detail workspace."
      profile={profile}
    >
      <section className="card stack">
        <h2>Planned V1 capabilities</h2>
        <ul className="panel-list">
          <li>Create and search patient records</li>
          <li>Store demographics and contact information</li>
          <li>Attach appointments, screenings, notes, and documents</li>
          <li>Enforce role-aware access through Supabase RLS</li>
        </ul>
      </section>
    </AppShell>
  );
}
