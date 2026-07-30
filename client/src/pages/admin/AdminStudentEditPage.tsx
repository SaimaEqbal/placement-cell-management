import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, FileText, GraduationCap, Save, User } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { FormSection } from "@/components/dashboard/FormSection";
import { Field } from "@/components/dashboard/Field";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
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
import { useStudent, useUpdateStudentRecord } from "../../hooks/useStudents";
import { computeCgpa } from "../../lib/cgpa";
import { capitalize } from "../../lib/format";
import {
  BATCH_OPTIONS,
  DEPARTMENT_BRANCHES,
  DEPARTMENT_OPTIONS,
  SEMESTERS,
} from "../../lib/validation";
import { paths } from "../../routes/paths";
import type { StudentRecord, UpdateStudentPayload } from "../../services/studentService";

const SPI_KEYS = [
  "sem1_spi", "sem2_spi", "sem3_spi", "sem4_spi",
  "sem5_spi", "sem6_spi", "sem7_spi", "sem8_spi",
] as const;

const PLACEMENT_STATUSES: StudentRecord["placement_status"][] = [
  "unplaced",
  "shortlisted",
  "placed",
  "second_chance",
  "rejected",
];

/** Empty string for a nullable value; otherwise its string form. */
function s(v: unknown): string {
  return v == null ? "" : String(v);
}

/** Optional number: undefined for blank, else the parsed number. */
function numOpt(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Purpose: /Admin/students/:studentId/edit - the admin's full-record editor. Unlike
 * the student wizard (which locks historical academic data), the admin may edit
 * EVERYTHING, including SPIs, backlog counts, semester and percentages, to correct
 * genuine mistakes. Submits the COMPLETE record via PUT /students/:id
 * (updateStudent overwrites every column, so omitted fields would become NULL -
 * hence the form always sends the full prefilled record). CGPA is derived
 * server-side from the SPIs.
 */
export default function AdminStudentEditPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError, error, refetch } = useStudent(studentId);
  const update = useUpdateStudentRecord();

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
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [placementStatus, setPlacementStatus] = useState<StudentRecord["placement_status"]>("unplaced");
  // Academic
  const [tenthPercentage, setTenthPercentage] = useState("");
  const [twelfthPercentage, setTwelfthPercentage] = useState("");
  const [spi, setSpi] = useState<string[]>(() => Array(8).fill(""));
  const [activeBacklogs, setActiveBacklogs] = useState("");
  const [passiveBacklogs, setPassiveBacklogs] = useState("");
  // Documents
  const [resumeUrl, setResumeUrl] = useState("");
  const [tenthUrl, setTenthUrl] = useState("");
  const [twelfthUrl, setTwelfthUrl] = useState("");
  const [lastSemUrl, setLastSemUrl] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    if (!student) return;
    setName(student.name ?? "");
    setRollNo(student.roll_no ?? "");
    setEmail(student.email ?? "");
    setPhone(student.phone ?? "");
    // Stored DOB may be a full ISO timestamp; the DatePicker expects "YYYY-MM-DD".
    setDateOfBirth(student.date_of_birth ? student.date_of_birth.slice(0, 10) : "");
    setGender(student.gender ? capitalize(student.gender) : "");
    setRegion(student.region ?? "");
    setReligion(student.religion ?? "");
    setDepartment(student.department ?? "");
    setBranch(student.branch ?? "");
    setBatch(s(student.batch));
    setSemester(s(student.semester));
    setPlacementStatus(student.placement_status ?? "unplaced");
    setTenthPercentage(s(student.tenth_percentage));
    setTwelfthPercentage(s(student.twelfth_percentage));
    setSpi(SPI_KEYS.map((k) => s(student[k])));
    setActiveBacklogs(s(student.active_backlogs));
    setPassiveBacklogs(s(student.passive_backlogs));
    setResumeUrl(student.resume_url ?? "");
    setTenthUrl(student.tenth_marksheet_url ?? "");
    setTwelfthUrl(student.twelfth_marksheet_url ?? "");
    setLastSemUrl(student.last_sem_marksheet_url ?? "");
    setPaymentReceiptUrl(student.payment_receipt_url ?? "");
    setPaymentId(student.payment_id ?? "");
  }, [student]);

  const sem = Number(semester);
  const computedCgpa = computeCgpa(spi, sem);
  const branchOptions = department ? DEPARTMENT_BRANCHES[department] ?? [] : [];

  const backPath = paths.adminStudents;

  function handleSubmit() {
    // updateStudent overwrites the full record, so send every column it writes -
    // omitted ones would be NULLed. cgpa is derived server-side.
    const payload: UpdateStudentPayload = {
      name: name.trim(),
      roll_no: rollNo.trim(),
      email: email.trim(),
      phone: phone.trim(),
      // Omit when blank: z.coerce.date() rejects "" (Invalid Date).
      date_of_birth: dateOfBirth || undefined,
      gender: gender.trim(),
      region: region.trim(),
      religion: religion.trim(),
      department,
      branch,
      batch: numOpt(batch),
      semester: numOpt(semester),
      placement_status: placementStatus,
      tenth_percentage: numOpt(tenthPercentage),
      twelfth_percentage: numOpt(twelfthPercentage),
      active_backlogs: numOpt(activeBacklogs),
      passive_backlogs: numOpt(passiveBacklogs),
      resume_url: resumeUrl.trim(),
      tenth_marksheet_url: tenthUrl.trim(),
      twelfth_marksheet_url: twelfthUrl.trim(),
      last_sem_marksheet_url: lastSemUrl.trim(),
      payment_receipt_url: paymentReceiptUrl.trim(),
      payment_id: paymentId.trim(),
    };
    // Attach each completed semester's SPI (the backend enforces completeness).
    spi.forEach((value, i) => {
      if (value.trim() !== "") payload[SPI_KEYS[i]] = Number(value);
    });

    setFormError(undefined);
    if (studentId === undefined) return;
    update.mutate(
      { id: studentId, payload },
      { onSuccess: () => navigate(`${backPath}/${studentId}`) },
    );
  }

  const documents = useMemo(
    () => [
      ["Resume URL", resumeUrl, setResumeUrl] as const,
      ["10th marksheet URL", tenthUrl, setTenthUrl] as const,
      ["12th marksheet URL", twelfthUrl, setTwelfthUrl] as const,
      ["Latest semester marksheet URL", lastSemUrl, setLastSemUrl] as const,
      ["Payment receipt URL", paymentReceiptUrl, setPaymentReceiptUrl] as const,
    ],
    [resumeUrl, tenthUrl, twelfthUrl, lastSemUrl, paymentReceiptUrl],
  );

  return (
    <>
      <Topbar
        title="Edit student"
        subtitle="Admin override — every field, including locked academic records, is editable."
      />
      <PageContainer>
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={studentId ? `${backPath}/${studentId}` : backPath}>
              <ArrowLeft /> Back to student
            </Link>
          </Button>
        </div>

        {isLoading && <LoadingState label="Loading student..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load the student."} onRetry={refetch} />
        )}

        {student && (
          <form
            className="flex flex-col gap-6"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <FormSection icon={<User />} title="Personal information" subtitle="Identity and contact details.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Roll number" htmlFor="roll">
                  <Input id="roll" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="Date of birth" htmlFor="dob">
                  <DatePicker id="dob" value={dateOfBirth} onChange={setDateOfBirth} />
                </Field>
                <Field label="Gender" htmlFor="gender">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Male", "Female", "Other"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Region" htmlFor="region">
                  <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
                </Field>
                <Field label="Religion" htmlFor="religion">
                  <Input id="religion" value={religion} onChange={(e) => setReligion(e.target.value)} />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<GraduationCap />} title="Course" subtitle="Department, branch, batch and current semester.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department" htmlFor="department">
                  <Select
                    value={department}
                    onValueChange={(v) => { setDepartment(v); setBranch(""); }}
                  >
                    <SelectTrigger id="department"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Branch" htmlFor="branch">
                  <Select value={branch} onValueChange={setBranch} disabled={!department}>
                    <SelectTrigger id="branch"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Batch (graduation year)" htmlFor="batch">
                  <Select value={batch} onValueChange={setBatch}>
                    <SelectTrigger id="batch"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {BATCH_OPTIONS.map((b) => (
                        <SelectItem key={b.year} value={String(b.year)}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Current semester" htmlFor="semester">
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger id="semester"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Placement status" htmlFor="placement">
                  <Select value={placementStatus} onValueChange={(v) => setPlacementStatus(v as StudentRecord["placement_status"])}>
                    <SelectTrigger id="placement"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLACEMENT_STATUSES.map((p) => (
                        <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<ClipboardList />} title="Academic records" subtitle="Percentages, semester SPIs and backlog counts. CGPA is recomputed from the SPIs.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="10th percentage" htmlFor="tenth">
                  <Input id="tenth" type="number" step="0.01" min="0" max="100" value={tenthPercentage} onChange={(e) => setTenthPercentage(e.target.value)} />
                </Field>
                <Field label="12th percentage" htmlFor="twelfth">
                  <Input id="twelfth" type="number" step="0.01" min="0" max="100" value={twelfthPercentage} onChange={(e) => setTwelfthPercentage(e.target.value)} />
                </Field>
                <Field label="CGPA (auto-calculated)" htmlFor="cgpa" hint="Derived from the SPIs — not editable.">
                  <Input id="cgpa" readOnly value={computedCgpa !== null ? computedCgpa.toFixed(2) : "—"} className="bg-muted text-muted-foreground" />
                </Field>
                <Field label="Active backlogs" htmlFor="active">
                  <Input id="active" type="number" min="0" value={activeBacklogs} onChange={(e) => setActiveBacklogs(e.target.value)} />
                </Field>
                <Field label="Passive (cleared) backlogs" htmlFor="passive">
                  <Input id="passive" type="number" min="0" value={passiveBacklogs} onChange={(e) => setPassiveBacklogs(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-sm font-medium">Semester SPIs</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {spi.map((value, index) => {
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
                          onChange={(e) => setSpi((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                        />
                      </Field>
                    );
                  })}
                </div>
              </div>
            </FormSection>

            <FormSection icon={<FileText />} title="Documents" subtitle="Hosted URLs (e.g. Google Drive links).">
              <div className="grid gap-4 sm:grid-cols-2">
                {documents.map(([label, value, setter]) => (
                  <Field key={label} label={label} htmlFor={label}>
                    <Input id={label} value={value} onChange={(e) => setter(e.target.value)} autoComplete="off" />
                  </Field>
                ))}
                <Field label="Payment ID" htmlFor="paymentId">
                  <Input id="paymentId" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} autoComplete="off" />
                </Field>
              </div>
            </FormSection>

            {(formError || update.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {formError ? (
                    formError
                  ) : update.error?.fieldErrors ? (
                    <ul className="list-disc space-y-0.5 pl-4">
                      {Object.entries(update.error.fieldErrors).map(([field, messages]) => (
                        <li key={field}>
                          <span className="font-medium">{field.replace(/_/g, " ")}:</span>{" "}
                          {messages.join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    update.error?.message ?? "Could not save the student."
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button asChild type="button" variant="outline">
                <Link to={studentId ? `${backPath}/${studentId}` : backPath}>Cancel</Link>
              </Button>
              <Button type="submit" size="lg" disabled={update.isPending}>
                <Save /> {update.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </PageContainer>
    </>
  );
}
