import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Link2Off } from "lucide-react";

import Brand from "../../components/Brand";
import { useResetPassword } from "../../hooks/useAuthMutations";
import { validateConfirmPassword, validatePassword } from "../../lib/validation";
import { paths } from "../../routes/paths";

import "../../styles/auth-status.css";

/** Purpose: /reset-password - set a new password via POST /auth/reset-password, using the token from the reset email. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetMutation = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    const nextErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword) return;

    resetMutation.mutate({ token, password });
  }

  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <Brand compact />
          <div className="auth-status-icon error">
            <Link2Off size={26} />
          </div>
          <h2>Missing reset link</h2>
          <p className="muted">
            This page needs the link from your password-reset email - please open it directly
            from your inbox, or request a new one.
          </p>
          <div className="back-link">
            <Link className="text-btn" to={paths.forgotPassword}>
              Request a new link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand compact />

        {resetMutation.isSuccess ? (
          <>
            <div className="auth-status-icon success">
              <CheckCircle2 size={26} />
            </div>
            <h2>Password updated</h2>
            <p className="muted">{resetMutation.data.message} You can now sign in.</p>
          </>
        ) : (
          <>
            <div className="auth-status-icon pending">
              <KeyRound size={26} />
            </div>
            <h2>Choose a new password</h2>
            <p className="muted">This link expires 15 minutes after it was sent.</p>

            <form onSubmit={handleSubmit} noValidate>
              <label>
                New password
                <div className="input-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>
              <label>
                Confirm new password
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </label>

              {resetMutation.isError && (
                <span className="field-error">{resetMutation.error.message}</span>
              )}

              <button className="primary wide" type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Updating..." : "Update password"} <ArrowRight size={17} />
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
