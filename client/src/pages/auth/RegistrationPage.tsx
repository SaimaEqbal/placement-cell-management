import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";

import Brand from "../../components/Brand";
import { SectionTitle } from "../../components/ui";
import { useResendVerification, useSignup } from "../../hooks/useAuthMutations";
import { validateConfirmPassword, validateInstitutionalEmail, validatePassword, } from "../../lib/validation";
import { paths } from "../../routes/paths";

import "../../styles/form-wizard.css";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** Purpose: /register - create the student account via POST /auth/signup. */
export default function RegistrationPage() {
  const signupMutation = useSignup();
  // Lets the "Check your inbox" screen re-send the verification email without making the student go back to the login page to do it.
  const resendMutation = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Purpose: validate the credential fields, then call POST /auth/signup (email + password only). */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      email: validateInstitutionalEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    /** Email is lowercased here so the account is created with the same canonical form the user will log in with (emails are case-insensitive). */
    signupMutation.mutate({ email: email.trim().toLowerCase(), password });
  }

  if (signupMutation.isSuccess) {
    return (
      <div className="public-page">
        <header className="public-header">
          <Brand />
        </header>
        <div className="register-wrap">
          <div className="page-heading">
            <div className="auth-status-icon success" style={{ margin: "0 auto 18px" }}>
              <MailCheck size={26} />
            </div>
            <h1>Check your inbox</h1>
            <p>
              We sent a verification link to <b>{email.trim().toLowerCase()}</b>. Open it to
              activate your account, then come back and sign in.
            </p>

            <p style={{ marginTop: 16 }}>
              Didn't receive the email?{" "}
              <button
                type="button"
                className="text-btn"
                style={{ display: "inline", margin: 0 }}
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate(email.trim().toLowerCase())}
              >
                {resendMutation.isPending ? "Resending..." : "Resend it"}{" "}
                <ArrowRight size={14} />
              </button>
            </p>
            {resendMutation.isSuccess && (
              <span className="field-error" style={{ color: "var(--green)" }}>
                Verification email sent - check your inbox.
              </span>
            )}
            {resendMutation.isError && (
              <span className="field-error">{resendMutation.error.message}</span>
            )}

            <Link className="text-btn" to={paths.login} style={{ marginTop: 18 }}>
              Back to sign in <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <Link className="ghost" to={paths.login}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </header>
      <div className="register-wrap">
        <div className="page-heading">
          <div className="eyebrow">Student onboarding</div>
          <h1>Create your student account</h1>
          <p>Just your login details for now - you'll complete your academic profile after your first login.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <section className="form-section">
            <SectionTitle icon={<MailCheck size={18} />} title="Account details" subtitle="Your login credentials"/>
            <div className="form-grid">
              <label>
                Institutional email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username"/>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <span />
              <label>
                Password
                <div className="input-icon">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)}/>
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>
              <label>
                Confirm password
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/>
                {errors.confirmPassword && (<span className="field-error">{errors.confirmPassword}</span>)}
              </label>
            </div>
          </section>

          {signupMutation.isError && (<span className="field-error">{signupMutation.error.message}</span>)}

          <div className="form-actions">
            <p>Your information is securely stored.</p>
            <button className="primary" type="submit" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "Creating account..." : "Create account"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}