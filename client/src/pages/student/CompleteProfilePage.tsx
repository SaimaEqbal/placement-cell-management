import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";

import { SectionTitle } from "../../components/ui";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../context/AuthContext";
import { useCreateProfile, useProfile, useUpdateProfile } from "../../hooks/useProfile";
import { readRegistrationDraft } from "../../lib/registrationDraft";
import { DEPARTMENTS } from "../../lib/validation";
import { paths } from "../../routes/paths";
import type { CreateStudentPayload } from "../../services/studentService";

import "../../styles/form-wizard.css";
import "../../styles/dashboard.css";

interface BacklogRow {
  subject: string;
  semester: string;
  status: "active" | "cleared";
}

/**
 * Purpose: /Student/complete-profile - the single-page form behind the
 * brief's Profile Completion section (Personal/Academic info + Documents).
 * Creates the student's row on first visit (POST /students via
 * useCreateProfile) or edits it on later visits (PUT /students/:id via
 * useUpdateProfile) - which mode depends on whether GET /students/me
 * already resolved a profile.
 *
 * The brief's "Backlogs" field is modelled here as a small editable table
 * (subject + semester + active/cleared) purely for data entry; since the
 * `students` table only stores aggregate active_backlogs/passive_backlogs
 * counts (server/src/migrations/001_create_students.sql,
 * 005_alter_students.sql - no per-subject backlog table exists), the table
 * rows are reduced to those two counts before submitting.
 */
export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile(profile?.id);

  const draft = readRegistrationDraft();

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [religion, setReligion] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [tenthUrl, setTenthUrl] = useState("");
  const [twelfthUrl, setTwelfthUrl] = useState("");
  const [lastSemUrl, setLastSemUrl] = useState("");
  const [backlogs, setBacklogs] = useState<BacklogRow[]>([]);
  const [formError, setFormError] = useState<string | undefined>();

  // Identity fields (name, roll number, institutional email, department) are
  // already collected at registration. When a value is available - from an
  // existing profile or the registration draft - lock that field so it is
  // shown for confirmation but not redundantly re-entered here. If no value is
  // available (e.g. an old draft or a different browser), the field stays
  // editable so the student is never blocked from saving.
  const identityLocked = {
    name: Boolean(profile?.name || draft?.fullName),
    rollNo: Boolean(profile?.roll_no || draft?.rollNumber),
    // Email is always known once signed in (carried in the JWT), so it is
    // locked for every authenticated student, draft or not.
    email: Boolean(profile?.email || draft?.email || user?.email),
    branch: Boolean(profile?.branch || draft?.department),
  };

  // Purpose: pre-fill the form once - from the existing profile if one was
  // already created, otherwise from the registration draft saved at signup
  // (see registrationDraft.ts). A plain effect + plain useState (not
  // Context) is enough here: this is a single page's local form state, not
  // shared across routes the way auth/multi-step-workflow state is.
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setRollNo(profile.roll_no ?? "");
      setEmail(profile.email ?? "");
      setBranch(profile.branch ?? "");
      setPhone(profile.phone ?? "");
      setCgpa(profile.cgpa ?? "");
      setGraduationYear(profile.graduation_year ? String(profile.graduation_year) : "");
      setGender(profile.gender ?? "");
      setRegion(profile.region ?? "");
      setReligion(profile.religion ?? "");
      setDateOfBirth(profile.date_of_birth ?? "");
      setResumeUrl(profile.resume_url ?? "");
      setTenthUrl(profile.tenth_marksheet_url ?? "");
      setTwelfthUrl(profile.twelfth_marksheet_url ?? "");
      setLastSemUrl(profile.last_sem_marksheet_url ?? "");
    } else if (draft) {
      setName(draft.fullName);
      setRollNo(draft.rollNumber);
      // Carry the institutional email forward - from the registration draft if
      // present, otherwise from the signed-in session (JWT) - so it isn't
      // redundantly re-collected here.
      setEmail(draft.email || user?.email || "");
      setBranch(draft.department);
    } else if (user?.email) {
      // Returning student with no draft (e.g. logged in fresh): the email is
      // still known from the access token, so pre-fill it rather than asking again.
      setEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function addBacklogRow() {
    setBacklogs((rows) => [...rows, { subject: "", semester: "", status: "active" }]);
  }

  function updateBacklogRow(index: number, patch: Partial<BacklogRow>) {
    setBacklogs((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeBacklogRow(index: number) {
    setBacklogs((rows) => rows.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !rollNo.trim() || !email.trim() || !branch) {
      setFormError("Name, roll number, email, and branch are required.");
      return;
    }
    setFormError(undefined);

    const activeBacklogs = backlogs.filter((row) => row.status === "active").length;
    const passiveBacklogs = backlogs.filter((row) => row.status === "cleared").length;

    const payload: CreateStudentPayload = {
      roll_no: rollNo.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      branch,
      graduation_year: Number(graduationYear) || new Date().getFullYear(),
      cgpa: Number(cgpa) || 0,
      gender,
      region,
      religion,
      date_of_birth: dateOfBirth,
      active_backlogs: activeBacklogs,
      passive_backlogs: passiveBacklogs,
      resume_url: resumeUrl,
      tenth_marksheet_url: tenthUrl,
      twelfth_marksheet_url: twelfthUrl,
      last_sem_marksheet_url: lastSemUrl,
      placement_status: profile?.placement_status ?? "unplaced",
    };

    const onSuccess = () => navigate(paths.studentProfile);

    if (profile) {
      updateMutation.mutate(payload, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  }

  const mutation = profile ? updateMutation : createMutation;

  if (isLoading) {
    return (
      <>
        <Topbar title="Complete your profile" subtitle="" />
        <div className="dashboard-content">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={profile ? "Edit your profile" : "Complete your profile"}
        subtitle="Add your academic details and documents for placement review."
      />
      <div className="dashboard-content">
        <form onSubmit={handleSubmit} noValidate>
          <section className="form-section">
            <SectionTitle
              icon={<User size={18} />}
              title="Personal information"
              subtitle="Your basic identity and contact details."
            />
            <div className="form-grid">
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={identityLocked.name}
                />
                {identityLocked.name && (
                  <span className="field-hint">From your registration</span>
                )}
              </label>
              <label>
                Roll number
                <input
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  readOnly={identityLocked.rollNo}
                />
                {identityLocked.rollNo && (
                  <span className="field-hint">From your registration</span>
                )}
              </label>
              <label>
                Institutional email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={identityLocked.email}
                />
                {identityLocked.email && (
                  <span className="field-hint">From your registration</span>
                )}
              </label>
              <label>
                Contact number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </label>
              <label>
                Gender
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Region
                <input value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>
              <label>
                Religion
                <input value={religion} onChange={(e) => setReligion(e.target.value)} />
              </label>
            </div>
          </section>

          <section className="form-section">
            <SectionTitle
              icon={<GraduationCap size={18} />}
              title="Academic information"
              subtitle="Branch, CGPA, and graduation details."
            />
            <div className="form-grid">
              <label>
                Department / branch
                {identityLocked.branch ? (
                  // Already chosen at registration - show read-only instead of
                  // re-prompting via the department dropdown.
                  <>
                    <input value={branch} readOnly />
                    <span className="field-hint">From your registration</span>
                  </>
                ) : (
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label>
                Graduation year
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                />
              </label>
              <label>
                CGPA
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                />
              </label>
            </div>

            <div className="editable-table">
              <div className="table-head">
                <span>Subject</span>
                <span>Semester</span>
                <span>Status</span>
                <span />
              </div>
              {backlogs.map((row, index) => (
                <div className="table-edit-row" key={index}>
                  <input
                    placeholder="Subject"
                    value={row.subject}
                    onChange={(e) => updateBacklogRow(index, { subject: e.target.value })}
                  />
                  <input
                    placeholder="Semester"
                    value={row.semester}
                    onChange={(e) => updateBacklogRow(index, { semester: e.target.value })}
                  />
                  <select
                    value={row.status}
                    onChange={(e) =>
                      updateBacklogRow(index, { status: e.target.value as BacklogRow["status"] })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="cleared">Cleared</option>
                  </select>
                  <button type="button" onClick={() => removeBacklogRow(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="secondary" onClick={addBacklogRow} style={{ marginTop: 12 }}>
              <Plus size={14} /> Add backlog row
            </button>
          </section>

          <section className="form-section">
            <SectionTitle
              icon={<ClipboardList size={18} />}
              title="Documents"
              subtitle="Paste a hosted URL for each document (e.g. a cloud storage link)."
            />
            <div className="form-grid">
              <label>
                Resume URL
                <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
              </label>
              <label>
                10th marksheet URL
                <input value={tenthUrl} onChange={(e) => setTenthUrl(e.target.value)} />
              </label>
              <label>
                12th marksheet URL
                <input value={twelfthUrl} onChange={(e) => setTwelfthUrl(e.target.value)} />
              </label>
              <label>
                Latest semester marksheet URL
                <input value={lastSemUrl} onChange={(e) => setLastSemUrl(e.target.value)} />
              </label>
            </div>
            <div className="upload-zone">
              <div className="upload-icon">
                <Upload size={18} />
              </div>
              <b>File upload coming soon</b>
              <span>For now, paste a link to your hosted document above.</span>
            </div>
          </section>

          {formError && <span className="field-error">{formError}</span>}
          {mutation.isError && <span className="field-error">{mutation.error.message}</span>}

          <div className="form-actions">
            <p>
              <FileText size={14} /> All fields can be edited again later from this page.
            </p>
            <button className="primary" type="submit" disabled={mutation.isPending}>
              <CheckCircle2 size={16} />
              {mutation.isPending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
