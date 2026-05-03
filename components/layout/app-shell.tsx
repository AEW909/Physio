import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { StaffProfile } from "@/lib/auth/types";

type AppShellProps = {
  title: string;
  description?: string;
  profile: StaffProfile;
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/screening", label: "Screening" },
];

export function AppShell({ title, description, profile, children }: AppShellProps) {
  return (
    <main className="shell app-shell-layout">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Physio</p>
          <h2 className="sidebar-title">Clinical workspace</h2>
          <p className="sidebar-copy">
            Staff-facing records, screening, and documentation tools built on a secure
            application foundation.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link className="nav-link" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-copy">
            Signed in as <strong>{profile.full_name ?? profile.email}</strong>
          </p>
          <p className="role-badge">{profile.role}</p>
          <SignOutButton />
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Staff Module</p>
            <h1>{title}</h1>
            {description ? <p className="lede">{description}</p> : null}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
