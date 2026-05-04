"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/login/actions";

function SignOutSubmit() {
  const { pending } = useFormStatus();

  return (
    <button className="button button-secondary" type="submit" disabled={pending}>
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmit />
    </form>
  );
}
