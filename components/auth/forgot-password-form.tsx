"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/login/actions";

type ForgotPasswordFormProps = {
  loginPath?: string;
};

const initialState = {
  error: "",
  success: "",
};

export function ForgotPasswordForm({ loginPath = "/login" }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form className="auth-form" action={formAction}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Sending reset link..." : "Send password reset link"}
      </button>

      <Link className="button button-secondary" href={loginPath}>
        Back to sign in
      </Link>
    </form>
  );
}
