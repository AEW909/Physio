"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button button-secondary"
      type="button"
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
