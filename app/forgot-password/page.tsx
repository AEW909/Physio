import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Staff Access</p>
        <h1>Reset your password.</h1>
        <p className="lede">
          Enter the email linked to your staff account and we&apos;ll send you a password reset link.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
