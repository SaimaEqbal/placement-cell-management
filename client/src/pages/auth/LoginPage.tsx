import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

import Brand from "../../components/Brand";
import { useAuth } from "../../context/AuthContext";
import { useLogin, useResendVerification } from "../../hooks/useAuthMutations";
import { decodeAccessToken } from "../../lib/jwt";
import { validateEmail } from "../../lib/validation";
import { homePathForRole, paths } from "../../routes/paths";
import type { Role } from "../../types";

import "../../styles/login.css";

/**
 * Purpose: /login - authenticate against POST /auth/login and route the
 * student/SPC/TPC/admin to their own dashboard.
 *
 * Behaviour change from the original mock: there is no "Sign in as"
 * role dropdown anymore. The real backend has no concept of a client-chosen
 * role at login - the role comes back encoded in the JWT (see
 * server/src/controllers/authController.js's login(), which signs
 * { userId, role }), so the UI now reads it from the token instead of
 * trusting a hand-picked select box.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const resendMutation = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  /** Purpose: client-side check, then POST /auth/login; on success store the token and route by the role it decodes to. */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }
    setFormError(undefined);

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          login(data.token);
          const decoded = decodeAccessToken(data.token);
          navigate(homePathForRole((decoded?.role as Role) ?? null), {
            replace: true,
          });
        },
      },
    );
  }

  // The backend returns 403 specifically when the account exists but its
  // email hasn't been verified yet (authController.js login()) - surface a
  // resend-verification action for that case instead of a generic error.
  const isUnverified = loginMutation.error?.status === 403;

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-hero">
          <div className="hero-grid" />
          <Brand />
          <div className="hero-copy">
            <div className="eyebrow light">
              <ShieldCheck size={15} /> Student placement portal
            </div>
            <h1>
              University Placement Cell
              <br />
              <em>Jamia Millia Islamia</em>
            </h1>
            <p>Student portal for placement profile submission and document updates.</p>
          </div>
          <p className="hero-foot">Jamia Millia Islamia · New Delhi</p>
        </section>

        <section className="login-panel">
          <div className="login-card">
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="eyebrow">Welcome back</div>
            <h2>Sign in to your portal</h2>
            <p className="muted">Enter your credentials to continue.</p>

            <form onSubmit={handleSubmit} noValidate>
              <label>
                Institutional email
                <input
                  type="email"
                  placeholder="e.g. example.jmi.ac.in"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <div className="input-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {formError && <span className="field-error">{formError}</span>}
              {!formError && loginMutation.isError && (
                <span className="field-error">
                  {loginMutation.error.message}
                  {isUnverified && (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="text-btn"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate(email.trim())}
                      >
                        Resend verification email
                      </button>
                    </>
                  )}
                </span>
              )}
              {resendMutation.isSuccess && (
                <span className="field-error" style={{ color: "var(--green)" }}>
                  Verification email sent - check your inbox.
                </span>
              )}

              <button className="primary wide" type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign in"} <ArrowRight size={17} />
              </button>
            </form>

            <div className="divider">
              <span>New student?</span>
            </div>
            <Link className="text-btn" to={paths.register}>
              Create your student profile <ArrowRight size={15} />
            </Link>
            <div className="divider">
              <span>Forgot something?</span>
            </div>
            <Link className="text-btn" to={paths.forgotPassword}>
              Reset your password <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
