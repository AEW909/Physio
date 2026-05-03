import { AppShell } from "@/components/layout/app-shell";
import { requireUser, getCurrentProfile } from "@/lib/auth/session";

const blocks = [
  "Patient records and demographics",
  "Session-linked notes",
  "AI screening drafts and red-flag prompts",
  "Transcription and clinical document drafting",
];

export default async function DashboardPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found. Seed the profiles table before continuing.");
  }

  return (
    <AppShell
      title="Dashboard"
      description="The new application foundation is now authenticated and ready for patient and note modules to be built on top."
      profile={profile}
    >
      <section className="grid">
        {blocks.map((block) => (
          <article className="card" key={block}>
            <h2>{block}</h2>
            <p>
              This area will be implemented as a secure module linked to Supabase data,
              role-aware policies, and auditable staff actions.
            </p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
