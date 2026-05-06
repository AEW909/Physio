"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { StaffProfile } from "@/lib/auth/types";

type TopNavProps = {
  profile: StaffProfile;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/notes/drafts", label: "Draft notes" },
  { href: "/screening", label: "Screening" },
  { href: "/account", label: "Account" },
];

export function TopNav({ profile }: TopNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar-shell">
      <div className="topbar">
        <Link className="brand-lockup" href="/dashboard">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-dot brand-dot-teal" />
            <span className="brand-dot brand-dot-sage" />
            <span className="brand-dot brand-dot-stone" />
          </div>
          <div>
            <p className="brand-name">
              <strong>Harris</strong> Physiotherapy
            </p>
            <p className="brand-subtitle">Clinical workspace</p>
          </div>
        </Link>

        <div className="topbar-actions">
          <Link
            aria-label="Home"
            className="button button-secondary button-small topbar-home-link"
            href="/dashboard"
            title="Home"
          >
            <span aria-hidden="true" className="topbar-home-icon">⌂</span>
          </Link>
          <button
            aria-controls="primary-menu"
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="menu-toggle"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open ? (
        <div className="menu-panel" id="primary-menu">
          <nav className="menu-nav" aria-label="Primary">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={`menu-link${active ? " menu-link-active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="menu-divider" />

          <div className="menu-profile">
            <p className="menu-profile-label">Signed in as</p>
            <p className="menu-profile-name">{profile.full_name ?? profile.email}</p>
            <p className="role-badge">{profile.role}</p>
          </div>

          <SignOutButton />
        </div>
      ) : null}
    </header>
  );
}
