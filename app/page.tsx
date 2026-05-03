import Link from "next/link";

const milestones = [
  {
    title: "Clinical records first",
    description:
      "Patient records, sessions, and note ownership are the foundation. AI sits inside this workflow rather than defining it.",
  },
  {
    title: "Server-side AI boundaries",
    description:
      "All OpenAI traffic will be routed through authenticated server endpoints with explicit draft status and traceable inputs.",
  },
  {
    title: "GDPR-aware architecture",
    description:
      "Supabase, role-aware access, audit logs, and data minimisation are treated as baseline design constraints.",
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Phase 1 Scaffold</p>
          <h1>Physio is now being rebuilt as a proper clinical platform.</h1>
          <p className="lede">
            The old prototype has been archived. This new application will be built on
            Next.js, Supabase, Vercel, and server-side AI integrations.
          </p>
          <div className="hero-actions">
            <Link className="button button-secondary" href="/login">
              Staff sign in
            </Link>
            <Link className="button button-primary" href="/patients">
              View patient module stub
            </Link>
            <Link className="button button-secondary" href="/screening">
              View screening module stub
            </Link>
          </div>
        </div>
        <aside className="hero-panel">
          <h2>Current build priorities</h2>
          <ul className="panel-list">
            <li>Auth and staff roles</li>
            <li>Patient records and sessions</li>
            <li>Clinical notes with versioning</li>
            <li>AI screening and note drafting</li>
          </ul>
        </aside>
      </section>

      <section className="grid">
        {milestones.map((milestone) => (
          <article className="card" key={milestone.title}>
            <h2>{milestone.title}</h2>
            <p>{milestone.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
