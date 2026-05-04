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
            {breadcrumbs?.length ? (
              <nav aria-label="Breadcrumb" className="breadcrumb-trail">
                {breadcrumbs.map((crumb, index) => (
                  <span className="breadcrumb-item" key={`${crumb.label}-${index}`}>
                    {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                  </span>
                ))}
              </nav>
            ) : null}
          </div>
        </header>
        {children}
        </section>
      </main>
    </div>
  );
}
