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
import { capitalize, toLowerTrim, toTitleCase, toUpperTrim } from "../../lib/format";
import { DEPARTMENT_BRANCHES, DEPARTMENT_OPTIONS, SEMESTERS } from "../../lib/validation";
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

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [semester, setSemester] = useState("");
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [twelfthPercentage, setTwelfthPercentage] = useState("");
  /** Per-semester SPI (sem1..sem8), one string per index; blanks are omitted from the payload. */
  const [spi, setSpi] = useState<string[]>(() => Array(8).fill(""));
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

  /**
   * The institutional email is the ONLY identity field the backend reliably
   * knows post-login: signup persists just email+password, and the login token
   * carries only { userId, role, email }. So email is the only field locked
   * here (pre-filled from the existing profile or the JWT); everything else -
   * name, roll number, department, etc. - is entered here and freely editable.
   */
  const emailLocked = Boolean(profile?.email || user?.email);

  /**
   * Purpose: pre-fill the form once from the existing profile (if any); on a
   * first visit always seed email from the JWT so it isn't re-collected here.
   * Plain useState is correct for single-page local form state.
   */
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setRollNo(profile.roll_no ?? "");
      setEmail(profile.email ?? "");
      setDepartment(profile.department ?? "");
      setBranch(profile.branch ?? "");
      setPhone(profile.phone ?? "");
      setCgpa(profile.cgpa ?? "");
      setGraduationYear(profile.graduation_year ? String(profile.graduation_year) : "");
      setSemester(profile.semester ? String(profile.semester) : "");
      setTenthPercentage(profile.tenth_percentage ?? "");
      setTwelfthPercentage(profile.twelfth_percentage ?? "");
      setSpi([
        profile.sem1_spi ?? "",
        profile.sem2_spi ?? "",
        profile.sem3_spi ?? "",
        profile.sem4_spi ?? "",
        profile.sem5_spi ?? "",
        profile.sem6_spi ?? "",
        profile.sem7_spi ?? "",
        profile.sem8_spi ?? "",
      ]);
      /** capitalize() so legacy lowercase values ("male") match the Male/Female option values below. */
      setGender(profile.gender ? capitalize(profile.gender) : "");
      setRegion(profile.region ?? "");
      setReligion(profile.religion ?? "");
      setDateOfBirth(profile.date_of_birth ?? "");
      setResumeUrl(profile.resume_url ?? "");
      setTenthUrl(profile.tenth_marksheet_url ?? "");
      setTwelfthUrl(profile.twelfth_marksheet_url ?? "");
      setLastSemUrl(profile.last_sem_marksheet_url ?? "");
    } else if (user?.email) {
      /** First visit: email is already known from the JWT access token. */
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

    /**
     * Per-field required check so the error names the EXACT missing field
     * instead of lumping all four together (which made it impossible to tell
     * which one React saw as empty).
     */
    const missing: string[] = [];
    if (!name.trim()) missing.push("Full name");
    if (!rollNo.trim()) missing.push("Roll number");
    if (!email.trim()) missing.push("Institutional email");
    if (!department) missing.push("Department");
    if (!branch) missing.push("Branch");
    if (!semester) missing.push("Current semester");
    if (!tenthPercentage.trim()) missing.push("10th percentage");
    if (!twelfthPercentage.trim()) missing.push("12th percentage");
    // A student in semester n must provide SPIs for every completed semester (1..n-1).
    const sem = Number(semester);
    if (sem >= 5) {
      for (let i = 1; i < sem; i++) {
        if (!spi[i - 1]?.trim()) missing.push(`Semester ${i} SPI`);
      }
    }
    if (missing.length > 0) {
      setFormError(
        missing.length === 1
          ? `${missing[0]} is required.`
          : `Required: ${missing.join(", ")}.`,
      );
      return;
    }
    setFormError(undefined);

    const activeBacklogs = backlogs.filter((row) => row.status === "active").length;
    const passiveBacklogs = backlogs.filter((row) => row.status === "cleared").length;

    /**
     * Normalise free-text identity fields into a consistent stored format:
     * name -> Title Case, roll number -> UPPERCASE, email -> lowercase,
     * region/religion -> UPPERCASE. (gender is already a Male/Female select.)
     * Applied here too - not just on blur - so the saved value is always
     * normalised even if a field never lost focus.
     */
    const payload: CreateStudentPayload = {
      roll_no: toUpperTrim(rollNo),
      name: toTitleCase(name),
      email: toLowerTrim(email),
      phone: phone.trim(),
      branch,
      department,
      graduation_year: Number(graduationYear) || new Date().getFullYear(),
      semester: Number(semester),
      cgpa: Number(cgpa) || 0,
      tenth_percentage: Number(tenthPercentage) || 0,
      twelfth_percentage: Number(twelfthPercentage) || 0,
      gender,
      region: toUpperTrim(region),
      religion: toUpperTrim(religion),
      date_of_birth: dateOfBirth,
      active_backlogs: activeBacklogs,
      passive_backlogs: passiveBacklogs,
      resume_url: resumeUrl,
      tenth_marksheet_url: tenthUrl,
      twelfth_marksheet_url: twelfthUrl,
      last_sem_marksheet_url: lastSemUrl,
      placement_status: profile?.placement_status ?? "unplaced",
    };

    /** SPIs are optional - only include the semesters the student actually filled. */
    const spiKeys = [
      "sem1_spi", "sem2_spi", "sem3_spi", "sem4_spi",
      "sem5_spi", "sem6_spi", "sem7_spi", "sem8_spi",
    ] as const;
    spi.forEach((value, index) => {
      if (value.trim() !== "") payload[spiKeys[index]] = Number(value);
    });

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
        {/* autoComplete="off" disables browser autofill for the whole form so a
            field can never be silently populated in the DOM without React state
            (which produced a "looks filled but flagged required" mismatch). */}
        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <section className="form-section">
            <SectionTitle
              icon={<User size={18} />}
              title="Personal information"
              subtitle="Your basic identity and contact details."
            />
            <div className="form-grid">
              <label>
                Full name
                {/* onBlur prettifies to Title Case so the student sees the
                    normalised value immediately, without fighting their typing. */}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setName((v) => toTitleCase(v))}
                  autoComplete="off"
                />
              </label>
              <label>
                Roll number
                {/* onBlur normalises to UPPERCASE. */}
                <input
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  onBlur={() => setRollNo((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
              </label>
              <label>
                Institutional email
                {/* Email is the only field known from the session, so it's the
                    only one locked here. */}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmail((v) => toLowerTrim(v))}
                  readOnly={emailLocked}
                  autoComplete="off"
                />
                {emailLocked && (
                  <span className="field-hint">From your account - cannot be changed</span>
                )}
              </label>
              <label>
                Contact number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="off"
                />
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
                {/* Binary Male/Female, stored capitalised. */}
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label>
                Region
                {/* onBlur normalises to UPPERCASE. */}
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  onBlur={() => setRegion((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
              </label>
              <label>
                Religion
                {/* onBlur normalises to UPPERCASE. */}
                <input
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  onBlur={() => setReligion((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
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
                Department
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    /** Changing the department clears the branch - the old branch may not belong to the new department. */
                    setBranch("");
                  }}
                >
                  <option value="">Select department</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>
              {department && (
                <label>
                  Branch
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {(DEPARTMENT_BRANCHES[department] ?? []).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Graduation year
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                />
              </label>
              <label>
                Current semester
                <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
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
              <label>
                10th percentage
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tenthPercentage}
                  onChange={(e) => setTenthPercentage(e.target.value)}
                />
              </label>
              <label>
                12th percentage
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={twelfthPercentage}
                  onChange={(e) => setTwelfthPercentage(e.target.value)}
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
              icon={<GraduationCap size={18} />}
              title="Semester SPIs"
              subtitle="Required for every completed semester (1 to your current semester minus 1)."
            />
            <div className="form-grid">
              {!semester && (
                <p className="field-hint">Select your current semester above to enter SPIs.</p>
              )}
              {spi.map((value, index) => {
                const sem = Number(semester);
                // Only completed semesters (1..n-1) are collected; hide the rest.
                if (!sem || index + 1 >= sem) return null;
                return (
                  <label key={index}>
                    Semester {index + 1} SPI
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={value}
                      onChange={(e) =>
                        setSpi((prev) =>
                          prev.map((v, i) => (i === index ? e.target.value : v)),
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
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
                <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} autoComplete="off" />
              </label>
              <label>
                10th marksheet URL
                <input value={tenthUrl} onChange={(e) => setTenthUrl(e.target.value)} autoComplete="off" />
              </label>
              <label>
                12th marksheet URL
                <input value={twelfthUrl} onChange={(e) => setTwelfthUrl(e.target.value)} autoComplete="off" />
              </label>
              <label>
                Latest semester marksheet URL
                <input value={lastSemUrl} onChange={(e) => setLastSemUrl(e.target.value)} autoComplete="off" />
              </label>
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
