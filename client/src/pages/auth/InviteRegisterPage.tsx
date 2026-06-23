import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldX, UserPlus } from "lucide-react";

import Brand from "../../components/Brand";
import { LoadingState, SectionTitle } from "../../components/ui";
import { useCompleteRegistration, useVerifyInvitation } from "../../hooks/useInvitations";
import { DEPARTMENTS, validateConfirmPassword, validateFullName, validatePassword, validatePhone } from "../../lib/validation";
import { paths } from "../../routes/paths";

import "../../styles/form-wizard.css";

interface FieldErrors { name?: string; phone?: string; branch?: string; password?: string; confirmPassword?: string; }

/** Purpose: /register/:token - the invite-acceptance page. Verifies the token (GET /invite/verify/:token), shows the invited email + role read-only, and lets the invitee set their name/phone/branch/password to finish registration (POST /invite/complete/:token). The backend returns no token on completion, so on success we send them to /login to sign in normally.*/
export default function InviteRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const verify = useVerifyInvitation(token);
  const complete = useCompleteRegistration();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    const nextErrors: FieldErrors = {
      name: validateFullName(name),
      phone: validatePhone(phone),
      branch: branch ? undefined : "Select a branch.",
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    complete.mutate({
      token,
      payload: { name: name.trim(), phone: phone.trim(), branch, password },
    });
  }

  if (verify.isLoading) {
    return (
      <div className="public-page">
        <header className="public-header">
          <Brand />
        </header>
        <div className="register-wrap">
          <LoadingState label="Checking your invitation..." />
        </div>
      </div>
    );
  }

  if (verify.isError || !verify.data) {
    return (
      <div className="public-page">
        <header className="public-header">
          <Brand />
        </header>
        <div className="register-wrap">
          <div className="page-heading">
            <div
              className="auth-status-icon"
              style={{ margin: "0 auto 18px", color: "var(--red)" }}
            >
              <ShieldX size={26} />
            </div>
            <h1>Invitation not valid</h1>
            <p> This invitation link is invalid or has expired. Ask your administrator to send a new one. </p>
            <Link className="text-btn" to={paths.login} style={{ marginTop: 18 }}> Back to sign in <ArrowRight size={15} /> </Link>
          </div>
        </div>
      </div>
    );
  }

  if (complete.isSuccess) {
    return (
      <div className="public-page">
        <header className="public-header">
          <Brand />
        </header>
        <div className="register-wrap">
          <div className="page-heading">
            <div
              className="auth-status-icon success"
              style={{ margin: "0 auto 18px" }}
            >
              <CheckCircle2 size={26} />
            </div>
            <h1>You're all set</h1>
            <p> Your account has been created. Sign in with <b>{verify.data.email}</b>{" "} and the password you just chose. </p>
            <Link className="text-btn" to={paths.login} style={{ marginTop: 18 }}> Go to sign in <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
      </header>
      <div className="register-wrap">
        <div className="page-heading">
          <div className="eyebrow">{verify.data.role.toUpperCase()} onboarding</div>
          <h1>Complete your registration</h1>
          <p>You were invited as <b>{verify.data.role.toUpperCase()}</b> using{" "}<b>{verify.data.email}</b>. Set your details below to activate your account.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <section className="form-section">
            <SectionTitle icon={<UserPlus size={18} />} title="Your details" subtitle="Name, contact, and a password" />
            <div className="form-grid">
              <label>
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </label>
              <label>
                Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                {errors.phone && (<span className="field-error">{errors.phone}</span>)}
              </label>
              <label>
                Branch
                <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">Select your Department...</option>
                  {DEPARTMENTS.map((dept) => (<option key={dept} value={dept}> {dept} </option>))}
                </select>
                {errors.branch && (<span className="field-error">{errors.branch}</span>)}
              </label>
              <span />
              <label>
                Password
                <div className="input-icon">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (<span className="field-error">{errors.password}</span>)}
              </label>
              <label>
                Confirm password
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                {errors.confirmPassword && (<span className="field-error">{errors.confirmPassword}</span>)}
              </label>
            </div>
          </section>

          {complete.isError && (<span className="field-error">{complete.error.message}</span>)}

          <div className="form-actions">
            <p>Your information is securely stored.</p>
            <button className="primary" type="submit" disabled={complete.isPending}>
              {complete.isPending ? "Creating account..." : "Complete registration"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}