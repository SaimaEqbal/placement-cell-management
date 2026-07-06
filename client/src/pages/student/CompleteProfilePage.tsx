import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  User,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { FormSection } from "@/components/dashboard/FormSection";
import { Field } from "@/components/dashboard/Field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { useCreateProfile, useProfile, useUpdateProfile } from "../../hooks/useProfile";
import { capitalize, toLowerTrim, toTitleCase, toUpperTrim } from "../../lib/format";
import { DEPARTMENT_BRANCHES, DEPARTMENT_OPTIONS, SEMESTERS } from "../../lib/validation";
import { paths } from "../../routes/paths";
import type { CreateStudentPayload } from "../../services/studentService";

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
 * counts, the table rows are reduced to those two counts before submitting.
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
   * here (pre-filled from the existing profile or the JWT); everything else is
   * entered here and freely editable.
   */
  const emailLocked = Boolean(profile?.email || user?.email);

  /**
   * Pre-fill the form once from the existing profile (if any); on a first visit
   * always seed email from the JWT so it isn't re-collected here.
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
     * instead of lumping all four together.
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
  const sem = Number(semester);

  if (isLoading) {
    return (
      <>
        <Topbar title="Complete your profile" subtitle="" />
        <PageContainer>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={profile ? "Edit your profile" : "Complete your profile"}
        subtitle="Add your academic details and documents for placement review."
      />
      <PageContainer>
        {/* autoComplete="off" disables browser autofill for the whole form so a
            field can never be silently populated in the DOM without React state. */}
        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col gap-6">
          <FormSection
            icon={<User />}
            title="Personal information"
            subtitle="Your basic identity and contact details."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setName((v) => toTitleCase(v))}
                  autoComplete="off"
                />
              </Field>
              <Field label="Roll number" htmlFor="rollNo">
                <Input
                  id="rollNo"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  onBlur={() => setRollNo((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Institutional email"
                htmlFor="email"
                hint={emailLocked ? "From your account — cannot be changed" : undefined}
              >
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmail((v) => toLowerTrim(v))}
                  readOnly={emailLocked}
                  autoComplete="off"
                  className={emailLocked ? "bg-muted text-muted-foreground" : undefined}
                />
              </Field>
              <Field label="Contact number" htmlFor="phone">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="Date of birth" htmlFor="dob">
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Region" htmlFor="region">
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  onBlur={() => setRegion((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
              </Field>
              <Field label="Religion" htmlFor="religion">
                <Input
                  id="religion"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  onBlur={() => setReligion((v) => toUpperTrim(v))}
                  autoComplete="off"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={<GraduationCap />}
            title="Academic information"
            subtitle="Branch, CGPA, and graduation details."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" htmlFor="department">
                <Select
                  value={department}
                  onValueChange={(value) => {
                    setDepartment(value);
                    /** Changing the department clears the branch - the old branch may not belong to the new department. */
                    setBranch("");
                  }}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {department && (
                <Field label="Branch" htmlFor="branch">
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {(DEPARTMENT_BRANCHES[department] ?? []).map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Graduation year" htmlFor="gradYear">
                <Input
                  id="gradYear"
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                />
              </Field>
              <Field label="Current semester" htmlFor="semester">
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CGPA" htmlFor="cgpa">
                <Input
                  id="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                />
              </Field>
              <Field label="10th percentage" htmlFor="tenth">
                <Input
                  id="tenth"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tenthPercentage}
                  onChange={(e) => setTenthPercentage(e.target.value)}
                />
              </Field>
              <Field label="12th percentage" htmlFor="twelfth">
                <Input
                  id="twelfth"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={twelfthPercentage}
                  onChange={(e) => setTwelfthPercentage(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="text-sm font-medium">Backlogs</div>
              {backlogs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No backlogs added. Add a row for each active or cleared backlog.
                </p>
              )}
              {backlogs.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_140px_150px_auto] sm:items-center sm:gap-3"
                >
                  <Input
                    placeholder="Subject"
                    value={row.subject}
                    onChange={(e) => updateBacklogRow(index, { subject: e.target.value })}
                  />
                  <Input
                    placeholder="Semester"
                    value={row.semester}
                    onChange={(e) => updateBacklogRow(index, { semester: e.target.value })}
                  />
                  <Select
                    value={row.status}
                    onValueChange={(value) =>
                      updateBacklogRow(index, { status: value as BacklogRow["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBacklogRow(index)}
                    aria-label="Remove backlog row"
                    className="justify-self-end text-muted-foreground"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div>
                <Button type="button" variant="outline" size="sm" onClick={addBacklogRow}>
                  <Plus /> Add backlog row
                </Button>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<GraduationCap />}
            title="Semester SPIs"
            subtitle="Required for every completed semester (1 to your current semester minus 1)."
          >
            {!semester ? (
              <p className="text-sm text-muted-foreground">
                Select your current semester above to enter SPIs.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spi.map((value, index) => {
                  // Only completed semesters (1..n-1) are collected; hide the rest.
                  if (!sem || index + 1 >= sem) return null;
                  return (
                    <Field key={index} label={`Semester ${index + 1} SPI`} htmlFor={`spi-${index}`}>
                      <Input
                        id={`spi-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={value}
                        onChange={(e) =>
                          setSpi((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))
                        }
                      />
                    </Field>
                  );
                })}
              </div>
            )}
          </FormSection>

          <FormSection
            icon={<ClipboardList />}
            title="Documents"
            subtitle="Paste a hosted URL for each document (e.g. a cloud storage link)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Resume URL" htmlFor="resumeUrl">
                <Input id="resumeUrl" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="10th marksheet URL" htmlFor="tenthUrl">
                <Input id="tenthUrl" value={tenthUrl} onChange={(e) => setTenthUrl(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="12th marksheet URL" htmlFor="twelfthUrl">
                <Input id="twelfthUrl" value={twelfthUrl} onChange={(e) => setTwelfthUrl(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Latest semester marksheet URL" htmlFor="lastSemUrl">
                <Input id="lastSemUrl" value={lastSemUrl} onChange={(e) => setLastSemUrl(e.target.value)} autoComplete="off" />
              </Field>
            </div>
          </FormSection>

          {(formError || mutation.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {formError ?? mutation.error?.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" /> All fields can be edited again later
              from this page.
            </p>
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              <CheckCircle2 />
              {mutation.isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </PageContainer>
    </>
  );
}
