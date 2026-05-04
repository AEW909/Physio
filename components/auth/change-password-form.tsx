"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess("Password updated successfully.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="auth-form">
      <label className="field">
        <span>New password</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>

      <label className="field">
        <span>Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}
