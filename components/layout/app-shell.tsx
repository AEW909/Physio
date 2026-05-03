import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import type { StaffProfile } from "@/lib/auth/types";

type AppShellProps = {
  title: string;
  description?: string;
  profile: StaffProfile;
  children: ReactNode;
};

export function AppShell({ title, description, profile, children }: AppShellProps) {
  return (
    <div className="app-frame">
      <TopNav profile={profile} />
      <main className="shell workspace-shell">
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
    </div>
  );
}
