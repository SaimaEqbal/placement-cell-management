import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, MailCheck } from "lucide-react";

import Brand from "../../components/Brand";
import { useForgotPassword } from "../../hooks/useAuthMutations";
import { validateEmail } from "../../lib/validation";
import { paths } from "../../routes/paths";

import "../../styles/auth-status.css";

/** Purpose: /forgot-password - request a reset link via POST /auth/forgot-password. */
export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(undefined);
    forgotMutation.mutate(email.trim());
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand compact />

        {forgotMutation.isSuccess ? (
          <>
            <div className="auth-status-icon success">
              <MailCheck size={26} />
            </div>
            <h2>Check your inbox</h2>
            {/* The backend deliberately always returns the same message here, whether or not the email exist to avoid leaking which emails are registered - see authController.js forgotPassword(). */}
            <p className="muted">{forgotMutation.data.message}</p>
          </>
        ) : (
          <>
            <div className="auth-status-icon pending">
              <KeyRound size={26} />
            </div>
            <h2>Forgot your password?</h2>
            <p className="muted">Enter your account email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} noValidate>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                {fieldError && <span className="field-error">{fieldError}</span>}
              </label>

              {forgotMutation.isError && (
                <span className="field-error">{forgotMutation.error.message}</span>
              )}

              <button className="primary wide" type="submit" disabled={forgotMutation.isPending}>
                {forgotMutation.isPending ? "Sending..." : "Send reset link"} <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}

        <div className="back-link">
          <Link className="text-btn" to={paths.login}>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
