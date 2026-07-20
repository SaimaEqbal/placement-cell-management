import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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
import { DocumentPreview } from "@/components/dashboard/DocumentPreview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useProfile, useUpsertMyProfile } from "../../hooks/useProfile";
import { capitalize, toLowerTrim, toTitleCase, toUpperTrim } from "../../lib/format";
import { computeCgpa } from "../../lib/cgpa";
import {
  BATCH_OPTIONS,
  DEPARTMENT_BRANCHES,
  DEPARTMENT_OPTIONS,
  SEMESTERS,
  validateBranch,
  validateDateOfBirth,
  validateDepartment,
  validateFullName,
  validateBatch,
  validatePercentage,
  validatePhone,
  validateRequired,
  validateRollNumber,
  validateSemester,
  validateSpi,
} from "../../lib/validation";
import { paths } from "../../routes/paths";
import type { UpdateStudentPayload } from "../../services/studentService";

interface BacklogRow {
  subject: string;
  semester: string;
  status: "active" | "cleared";
}

const STEPS = [
  { key: "personal", title: "Personal", icon: <User /> },
  { key: "course", title: "Course", icon: <GraduationCap /> },
  { key: "academic", title: "Academic", icon: <ClipboardList /> },
  { key: "documents", title: "Documents", icon: <FileText /> },
] as const;

const SPI_KEYS = [
  "sem1_spi", "sem2_spi", "sem3_spi", "sem4_spi",
  "sem5_spi", "sem6_spi", "sem7_spi", "sem8_spi",
] as const;

/**
 * Purpose: /Student/complete-profile - a 4-part wizard (Personal → Course →
 * Academic → Documents). Each step is committed to the DB on "Continue" via the
 * self-scoped partial upsert (PUT /students/me), so a student can leave and come
 * back without re-entering completed parts. CGPA is derived server-side; the
 * student never types it. The row is created on the first save.
 */
export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const save = useUpsertMyProfile();

  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | undefined>();

  // Personal
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [religion, setReligion] = useState("");
  // Course
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [semester, setSemester] = useState("");
  // Academic
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [twelfthPercentage, setTwelfthPercentage] = useState("");
  const [spi, setSpi] = useState<string[]>(() => Array(8).fill(""));
  const [backlogs, setBacklogs] = useState<BacklogRow[]>([]);
  // Documents
  const [resumeUrl, setResumeUrl] = useState("");
  const [tenthUrl, setTenthUrl] = useState("");
  const [twelfthUrl, setTwelfthUrl] = useState("");
  const [lastSemUrl, setLastSemUrl] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");

  /** Email is the only identity field the backend already knows post-login. */
  const emailLocked = Boolean(profile?.email || user?.email);

  /** Pre-fill once from the existing profile; seed email from the JWT on a first visit. */
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setRollNo(profile.roll_no ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setDateOfBirth(profile.date_of_birth ?? "");
      setGender(profile.gender ? capitalize(profile.gender) : "");
      setRegion(profile.region ?? "");
      setReligion(profile.religion ?? "");
      setDepartment(profile.department ?? "");
      setBranch(profile.branch ?? "");
      setGraduationYear(profile.batch ? String(profile.batch) : "");
      setSemester(profile.semester ? String(profile.semester) : "");
      setTenthPercentage(profile.tenth_percentage ?? "");
      setTwelfthPercentage(profile.twelfth_percentage ?? "");
      setSpi([
        profile.sem1_spi ?? "", profile.sem2_spi ?? "", profile.sem3_spi ?? "", profile.sem4_spi ?? "",
        profile.sem5_spi ?? "", profile.sem6_spi ?? "", profile.sem7_spi ?? "", profile.sem8_spi ?? "",
      ]);
      setResumeUrl(profile.resume_url ?? "");
      setTenthUrl(profile.tenth_marksheet_url ?? "");
      setTwelfthUrl(profile.twelfth_marksheet_url ?? "");
      setLastSemUrl(profile.last_sem_marksheet_url ?? "");
      setPaymentReceiptUrl(profile.payment_receipt_url ?? "");
      setPaymentId(profile.payment_id ?? "");
    } else if (user?.email) {
      setEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const sem = Number(semester);
  const computedCgpa = computeCgpa(spi, sem);

  // --- Per-step validation (returns the first error, or undefined) -----------
  function validatePersonal(): string | undefined {
    return [
      validateFullName(name),
      validateRollNumber(rollNo),
      validatePhone(phone),
      validateDateOfBirth(dateOfBirth),
      validateRequired(gender, "Gender"),
      validateRequired(region, "Region"),
      validateRequired(religion, "Religion"),
    ].find(Boolean);
  }
  function validateCourse(): string | undefined {
    return [
      validateDepartment(department),
      validateBranch(branch),
      validateSemester(semester),
      validateBatch(graduationYear),
    ].find(Boolean);
  }
  function validateAcademic(): string | undefined {
    const checks = [
      validatePercentage(tenthPercentage, "10th percentage"),
      validatePercentage(twelfthPercentage, "12th percentage"),
    ];
    if (Number.isFinite(sem)) {
      for (let i = 1; i < sem; i++) {
        checks.push(validateSpi(spi[i - 1] ?? "", `Semester ${i} SPI`));
      }
    }
    return checks.find(Boolean);
  }

  const validators = [validatePersonal, validateCourse, validateAcademic, () => undefined];

  // --- Per-step payloads (only that step's fields) ---------------------------
  function payloadFor(index: number): UpdateStudentPayload {
    if (index === 0) {
      return {
        name: toTitleCase(name),
        roll_no: toUpperTrim(rollNo),
        email: toLowerTrim(email),
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
        gender,
        region: toUpperTrim(region),
        religion: toUpperTrim(religion),
      };
    }
    if (index === 1) {
      return {
        department,
        branch,
        batch: Number(graduationYear),
        semester: Number(semester),
      };
    }
    if (index === 2) {
      const p: UpdateStudentPayload = {
        tenth_percentage: Number(tenthPercentage),
        twelfth_percentage: Number(twelfthPercentage),
        active_backlogs: backlogs.filter((r) => r.status === "active").length,
        passive_backlogs: backlogs.filter((r) => r.status === "cleared").length,
      };
      spi.forEach((value, i) => {
        if (value.trim() !== "") p[SPI_KEYS[i]] = Number(value);
      });
      return p;
    }
    // Documents: only include links that were actually entered (empty stays NULL
    // so completion status stays accurate).
    const p: UpdateStudentPayload = {};
    if (resumeUrl.trim()) p.resume_url = resumeUrl.trim();
    if (tenthUrl.trim()) p.tenth_marksheet_url = tenthUrl.trim();
    if (twelfthUrl.trim()) p.twelfth_marksheet_url = twelfthUrl.trim();
    if (lastSemUrl.trim()) p.last_sem_marksheet_url = lastSemUrl.trim();
    if (paymentReceiptUrl.trim()) p.payment_receipt_url = paymentReceiptUrl.trim();
    if (paymentId.trim()) p.payment_id = paymentId.trim();
    return p;
  }

  function handleContinue() {
    const err = validators[step]();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(undefined);
    save.mutate(payloadFor(step), {
      onSuccess: () => {
        if (step < STEPS.length - 1) setStep(step + 1);
        else navigate(paths.studentProfile);
      },
    });
  }

  function goBack() {
    setFormError(undefined);
    setStep((s) => Math.max(0, s - 1));
  }

  const addBacklogRow = () =>
    setBacklogs((rows) => [...rows, { subject: "", semester: "", status: "active" }]);
  const updateBacklogRow = (index: number, patch: Partial<BacklogRow>) =>
    setBacklogs((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeBacklogRow = (index: number) =>
    setBacklogs((rows) => rows.filter((_, i) => i !== index));

  const documents = useMemo(
    () => [
      { label: "Resume", url: resumeUrl },
      { label: "10th marksheet", url: tenthUrl },
      { label: "12th marksheet", url: twelfthUrl },
      { label: "Latest semester marksheet", url: lastSemUrl },
      { label: "Payment receipt", url: paymentReceiptUrl },
    ],
    [resumeUrl, tenthUrl, twelfthUrl, lastSemUrl, paymentReceiptUrl],
  );

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

  const isLast = step === STEPS.length - 1;

  return (
    <>
      <Topbar
        title={profile ? "Edit your profile" : "Complete your profile"}
        subtitle="Fill in each part — every step is saved as you continue."
      />
      <PageContainer>
        {/* Stepper */}
        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => {
            const state = i === step ? "current" : i < step ? "done" : "upcoming";
            return (
              <li key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                    state === "current" && "border-primary bg-primary text-primary-foreground",
                    state === "done" && "border-primary/40 text-primary",
                    state === "upcoming" && "text-muted-foreground",
                  )}
                >
                  <span className="grid size-5 place-items-center rounded-full bg-background/20 text-xs">
                    {state === "done" ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  {s.title}
                </div>
                {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
              </li>
            );
          })}
        </ol>

        <form
          className="flex flex-col gap-6"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
        >
          {step === 0 && (
            <FormSection icon={<User />} title="Personal information" subtitle="Your identity and contact details.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(toTitleCase(name))} autoComplete="off" />
                </Field>
                <Field label="Roll number" htmlFor="rollNo">
                  <Input id="rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} onBlur={() => setRollNo(toUpperTrim(rollNo))} autoComplete="off" />
                </Field>
                <Field label="Institutional email" htmlFor="email" hint={emailLocked ? "From your account — cannot be changed" : undefined}>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={emailLocked} autoComplete="off" className={emailLocked ? "bg-muted text-muted-foreground" : undefined} />
                </Field>
                <Field label="Contact number" htmlFor="phone">
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
                </Field>
                <Field label="Date of birth" htmlFor="dob">
                  <DatePicker id="dob" value={dateOfBirth} onChange={setDateOfBirth} toDate={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Gender" htmlFor="gender">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Region" htmlFor="region">
                  <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} onBlur={() => setRegion(toUpperTrim(region))} autoComplete="off" />
                </Field>
                <Field label="Religion" htmlFor="religion">
                  <Input id="religion" value={religion} onChange={(e) => setReligion(e.target.value)} onBlur={() => setReligion(toUpperTrim(religion))} autoComplete="off" />
                </Field>
              </div>
            </FormSection>
          )}

          {step === 1 && (
            <FormSection icon={<GraduationCap />} title="Course information" subtitle="Your department, branch, and year.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department" htmlFor="department">
                  <Select
                    value={department}
                    onValueChange={(value) => {
                      setDepartment(value);
                      setBranch("");
                    }}
                  >
                    <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {department && (
                  <Field label="Branch" htmlFor="branch">
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger id="branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {(DEPARTMENT_BRANCHES[department] ?? []).map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Batch of" htmlFor="gradYear">
                  <Select value={graduationYear} onValueChange={setGraduationYear}>
                    <SelectTrigger id="gradYear"><SelectValue placeholder="Select batch" /></SelectTrigger>
                    <SelectContent>
                      {BATCH_OPTIONS.map((b) => (
                        <SelectItem key={b.year} value={String(b.year)}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Current semester" htmlFor="semester">
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger id="semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((s) => (
                        <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>
          )}

          {step === 2 && (
            <FormSection icon={<ClipboardList />} title="Academic information" subtitle="SPIs, percentages, and backlogs. CGPA is calculated for you.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="10th percentage" htmlFor="tenth">
                  <Input id="tenth" type="number" step="0.01" min="0" max="100" value={tenthPercentage} onChange={(e) => setTenthPercentage(e.target.value)} />
                </Field>
                <Field label="12th percentage" htmlFor="twelfth">
                  <Input id="twelfth" type="number" step="0.01" min="0" max="100" value={twelfthPercentage} onChange={(e) => setTwelfthPercentage(e.target.value)} />
                </Field>
                <Field label="CGPA (auto-calculated)" htmlFor="cgpa" hint="Weighted average of your semester SPIs — not editable.">
                  <Input id="cgpa" readOnly value={computedCgpa !== null ? computedCgpa.toFixed(2) : "—"} className="bg-muted text-muted-foreground" />
                </Field>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-medium">Semester SPIs</div>
                {!semester ? (
                  <p className="text-sm text-muted-foreground">Select your current semester in the Course step to enter SPIs.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {spi.map((value, index) => {
                      if (!sem || index + 1 >= sem) return null;
                      return (
                        <Field key={index} label={`Semester ${index + 1} SPI`} htmlFor={`spi-${index}`}>
                          <Input id={`spi-${index}`} type="number" step="0.01" min="0" max="10" value={value} onChange={(e) => setSpi((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))} />
                        </Field>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="text-sm font-medium">Backlogs</div>
                {backlogs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No backlogs added. Add a row for each active or cleared backlog.</p>
                )}
                {backlogs.map((row, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_140px_150px_auto] sm:items-center sm:gap-3">
                    <Input placeholder="Subject" value={row.subject} onChange={(e) => updateBacklogRow(index, { subject: e.target.value })} />
                    <Input placeholder="Semester" value={row.semester} onChange={(e) => updateBacklogRow(index, { semester: e.target.value })} />
                    <Select value={row.status} onValueChange={(value) => updateBacklogRow(index, { status: value as BacklogRow["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cleared">Cleared</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBacklogRow(index)} aria-label="Remove backlog row" className="justify-self-end text-muted-foreground">
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
          )}

          {step === 3 && (
            <FormSection icon={<FileText />} title="Documents" subtitle="Paste a hosted URL (e.g. a Google Drive link) for each document. It previews below.">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
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
                  <Field label="Payment receipt URL" htmlFor="paymentReceiptUrl" hint="Paste a hosted link (e.g. Google Drive) to your placement-fee payment receipt.">
                    <Input id="paymentReceiptUrl" value={paymentReceiptUrl} onChange={(e) => setPaymentReceiptUrl(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Payment ID" htmlFor="paymentId" hint="The transaction/reference ID from your payment confirmation.">
                    <Input id="paymentId" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} autoComplete="off" />
                  </Field>
                </div>
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <DocumentPreview key={doc.label} label={doc.label} url={doc.url} />
                  ))}
                </div>
              </div>
            </FormSection>
          )}

          {(formError || save.isError) && (
            <Alert variant="destructive">
              <AlertDescription>{formError ?? save.error?.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || save.isPending}>
              <ArrowLeft /> Back
            </Button>
            <Button type="submit" size="lg" disabled={save.isPending}>
              {isLast ? <CheckCircle2 /> : <ArrowRight />}
              {save.isPending ? "Saving..." : isLast ? "Save & finish" : "Save & continue"}
            </Button>
          </div>
        </form>
      </PageContainer>
    </>
  );
}
