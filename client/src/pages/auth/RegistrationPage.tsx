import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";

import Brand from "../../components/Brand";
import { SectionTitle } from "../../components/ui";
import { useSignup } from "../../hooks/useAuthMutations";
import { saveRegistrationDraft } from "../../lib/registrationDraft";
import {
  DEPARTMENTS,
  SEMESTERS,
  validateConfirmPassword,
  validateDepartment,
  validateFullName,
  validateInstitutionalEmail,
  validatePassword,
  validateRollNumber,
  validateSemester,
} from "../../lib/validation";
import { paths } from "../../routes/paths";

import "../../styles/form-wizard.css";

interface FieldErrors {
  fullName?: string;
  rollNumber?: string;
  email?: string;
  department?: string;
  semester?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Purpose: /register - collect the minimal Student Registration fields the
 * brief specifies (Full Name, Roll Number, Institutional Email, Department,
 * Current Semester, Password, Confirm Password) and create the account via
 * POST /auth/signup.
 *
 * Structural change from the original mock: the marksheet-upload and
 * backlog-table sections that used to live on this page have moved to
 * CompleteProfilePage. The brief's own workflow diagram
 * (Register -> Email Verification -> Login -> Profile Incomplete -> Complete
 * Profile) and its "Profile Completion" section (CGPA, graduation year,
 * backlogs, documents) make clear those belong post-login, not at
 * registration - and the backend agrees: POST /auth/signup only ever
 * persists `email`/`password` (see authService.ts).
 */
export default function RegistrationPage() {
  const signupMutation = useSignup();

  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Purpose: validate every field per the brief's Validation Rules section before calling POST /auth/signup. */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      rollNumber: validateRollNumber(rollNumber),
      email: validateInstitutionalEmail(email),
      department: validateDepartment(department),
      semester: validateSemester(semester),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    // Stash the fields the backend has nowhere to store yet (see
    // registrationDraft.ts) so Complete Profile can pre-fill them later.
    saveRegistrationDraft({
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim(),
      department,
      semester,
    });

    signupMutation.mutate({ email: email.trim(), password });
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
              We sent a verification link to <b>{email.trim()}</b>. Open it to activate your
              account, then come back and sign in.
            </p>
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
          <p>Just the essentials for now - you'll complete your academic profile after your first login.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <section className="form-section">
            <SectionTitle
              icon={<MailCheck size={18} />}
              title="Account details"
              subtitle="Your identity and login credentials"
            />
            <div className="form-grid">
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Doe"
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </label>
              <label>
                Roll number
                <input
                  value={rollNumber}
                  onChange={(event) => setRollNumber(event.target.value)}
                  placeholder="23BCS058"
                />
                {errors.rollNumber && <span className="field-error">{errors.rollNumber}</span>}
              </label>
              <label>
                Institutional email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder=""
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label>
                Department
                <select value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && <span className="field-error">{errors.department}</span>}
              </label>
              <label>
                Current semester
                <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
                {errors.semester && <span className="field-error">{errors.semester}</span>}
              </label>
              <span />
              <label>
                Password
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
                Confirm password
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
            </div>
          </section>

          {signupMutation.isError && (
            <span className="field-error">{signupMutation.error.message}</span>
          )}

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
