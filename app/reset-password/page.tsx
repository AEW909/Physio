import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Staff Access</p>
        <h1>Choose a new password.</h1>
        <p className="lede">
          Set a new password for your Physio account. Once it&apos;s updated, you&apos;ll be sent back to sign in.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
