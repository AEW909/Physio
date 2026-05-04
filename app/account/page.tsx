import { AppShell } from "@/components/layout/app-shell";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getCurrentProfile, requireRole } from "@/lib/auth/session";

export default async function AccountPage() {
  await requireRole(["owner", "clinician", "admin"]);
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authenticated profile not found.");
  }

  return (
    <AppShell
      title="Account"
      description="Manage your sign-in details for the clinical workspace."
      eyebrow="Staff account"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Account" }]}
      profile={profile}
    >
      <section className="detail-grid">
        <article className="card stack">
          <p className="eyebrow">Signed in as</p>
          <h2>{profile.full_name ?? profile.email}</h2>
          <p className="lede">
            Role: <strong>{profile.role}</strong>
          </p>
          <p className="dashboard-section-note">
            Use this page to change your password without needing the Supabase dashboard.
          </p>
        </article>
        <article className="card stack">
          <p className="eyebrow">Security</p>
          <h2>Change password</h2>
          <p className="dashboard-section-note">
            This updates the underlying Supabase Auth password for this account.
          </p>
          <ChangePasswordForm />
        </article>
      </section>
    </AppShell>
  );
}
