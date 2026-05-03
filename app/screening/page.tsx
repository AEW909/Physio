import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";

export default async function ScreeningPage() {
  await requireRole(["owner", "clinician"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  return (
    <AppShell
      title="AI Screening"
      description="Screening will be rebuilt as a patient-linked module with server-side AI calls and mandatory clinician review."
      profile={profile}
    >
      <section className="card stack">
        <h2>Planned V1 capabilities</h2>
        <ul className="panel-list">
          <li>Structured pre-assessment form submission</li>
          <li>Draft triage summaries and red-flag prompts</li>
          <li>Link outputs to patient and appointment records</li>
          <li>Save AI outputs as editable drafts with audit history</li>
        </ul>
      </section>
    </AppShell>
  );
}
