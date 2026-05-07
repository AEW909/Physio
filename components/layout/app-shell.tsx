import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import type { StaffProfile } from "@/lib/auth/types";

type AppShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  profile: StaffProfile;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  children: ReactNode;
};

export function AppShell({ title, description, eyebrow = "Staff Module", profile, breadcrumbs, children }: AppShellProps) {
  return (
    <div className="app-frame">
      <TopNav profile={profile} />
      <main className="shell workspace-shell">
        <section className="workspace">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              {description ? <p className="lede">{description}</p> : null}
            </div>
          </header>
          {breadcrumbs?.length ? (
            <nav aria-label="Breadcrumb" className="workspace-breadcrumb-card">
              <div className="breadcrumb-trail">
                {breadcrumbs.map((crumb, index) => (
                  <span className="breadcrumb-item" key={`${crumb.label}-${index}`}>
                    {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                  </span>
                ))}
              </div>
            </nav>
          ) : null}
          {children}
        </section>
      </main>
    </div>
  );
}
