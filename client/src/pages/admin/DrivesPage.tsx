import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, Pencil, Plus } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { Field } from "@/components/dashboard/Field";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ShortlistReviewDialog } from "@/components/dashboard/ShortlistReviewDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "../../hooks/useCompanies";
import { useCreateDrive, useDrives, useUpdateDrive } from "../../hooks/useDrives";
import { formatDate } from "../../lib/format";
import { DEPARTMENTS } from "../../lib/validation";
import { paths } from "../../routes/paths";
import type {
  CreateDrivePayload,
  DriveRecord,
  DriveStatus,
  EligibleStudent,
  EmploymentType,
} from "../../services/driveService";
import type { StatusTone } from "../../types";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FTE", "Internship", "Internship + PPO"];

/** Local form state - all inputs are strings/arrays and get coerced to the API's number/array shape on submit. */
interface DriveFormState {
  company_id: string;
  job_role: string;
  job_description: string;
  package_ctc: string;
  employment_type: EmploymentType;
  drive_date: string;
  application_deadline: string;
  minimum_cgpa: string;
  allowed_branches: string[];
  max_active_backlogs: string;
  max_passive_backlogs: string;
  number_of_rounds: string;
}

const EMPTY_FORM: DriveFormState = {
  company_id: "",
  job_role: "",
  job_description: "",
  package_ctc: "",
  employment_type: "FTE",
  drive_date: "",
  application_deadline: "",
  minimum_cgpa: "",
  allowed_branches: [],
  max_active_backlogs: "",
  max_passive_backlogs: "",
  number_of_rounds: "",
};

/** Purpose: map a drive's lifecycle status to a Badge tone. */
function statusTone(status: DriveStatus): StatusTone {
  switch (status) {
    case "ongoing":
      return "amber";
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "blue"; // upcoming
  }
}

/** Purpose: turn an ISO timestamp into the YYYY-MM-DD a <input type="date"> needs. */
function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

/**
 * Purpose: turn a nullable numeric column into a text-input value. Nullable
 * drive columns (package_ctc, max_active_backlogs, max_passive_backlogs,
 * number_of_rounds) come back null; String(null) would produce the literal
 * "null", which then coerces to NaN and serialises to JSON null - the exact
 * cause of the backend's "expected number, received null" 400 on edit.
 */
function numToInput(value: number | string | null | undefined): string {
  return value != null ? String(value) : "";
}

/** Purpose: hydrate the form from an existing drive so it can be edited. */
function formFromDrive(drive: DriveRecord): DriveFormState {
  return {
    company_id: numToInput(drive.company_id),
    job_role: drive.job_role ?? "",
    job_description: drive.job_description ?? "",
    package_ctc: numToInput(drive.package_ctc),
    employment_type: drive.employment_type,
    drive_date: toDateInput(drive.drive_date),
    application_deadline: toDateInput(drive.application_deadline),
    minimum_cgpa: numToInput(drive.minimum_cgpa),
    allowed_branches: drive.allowed_branches ?? [],
    max_active_backlogs: numToInput(drive.max_active_backlogs),
    max_passive_backlogs: numToInput(drive.max_passive_backlogs),
    number_of_rounds: numToInput(drive.number_of_rounds),
  };
}

/**
 * Purpose: build the create/update payload from the string form state - sending
 * numbers as real numbers and omitting optional fields when blank so we never
 * send NaN/"" that would fail validation.
 */
function toCreatePayload(form: DriveFormState): CreateDrivePayload {
  const payload: CreateDrivePayload = {
    company_id: Number(form.company_id),
    employment_type: form.employment_type,
    drive_date: form.drive_date,
    application_deadline: form.application_deadline,
    minimum_cgpa: Number(form.minimum_cgpa),
    allowed_branches: form.allowed_branches,
  };

  /** Only forward an optional number when it parses to a finite value, so we can never serialise NaN as JSON null (which the backend rejects). */
  const setNum = (raw: string, key: "package_ctc" | "max_active_backlogs" | "max_passive_backlogs" | "number_of_rounds") => {
    if (raw === "") return;
    const n = Number(raw);
    if (Number.isFinite(n)) payload[key] = n;
  };

  if (form.job_role.trim()) payload.job_role = form.job_role.trim();
  if (form.job_description.trim()) payload.job_description = form.job_description.trim();
  setNum(form.package_ctc, "package_ctc");
  setNum(form.max_active_backlogs, "max_active_backlogs");
  setNum(form.max_passive_backlogs, "max_passive_backlogs");
  setNum(form.number_of_rounds, "number_of_rounds");

  return payload;
}

/**
 * Purpose: /Admin/drives - create, edit and list placement drives. Creating or
 * editing a drive returns an auto-generated list of eligible students, which the
 * admin reviews and confirms into the drive's shortlist (drive_students) before
 * managing them on the drive detail page. Students never apply themselves.
 */
export default function DrivesPage() {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();
  const createMutation = useCreateDrive();
  const updateMutation = useUpdateDrive();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DriveFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();

  /** After a successful create/edit, hold the drive + eligible list for the review dialog. */
  const [review, setReview] = useState<{
    driveId: number;
    label: string;
    eligibleStudents: EligibleStudent[];
    note?: string;
  } | null>(null);

  /** Drives only carry company_id; map to a name for display via the cached companies list. */
  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  const driveBasePath = paths.adminDrives;
  const mutation = editingId ? updateMutation : createMutation;

  function driveLabel(drive: DriveRecord): string {
    return (
      drive.job_role ||
      companyNameById.get(drive.company_id) ||
      `Drive #${drive.drive_id}`
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(undefined);
    setOpen(true);
  }

  function openEdit(drive: DriveRecord) {
    setEditingId(drive.drive_id);
    setForm(formFromDrive(drive));
    setFormError(undefined);
    setOpen(true);
  }

  function toggleBranch(branch: string) {
    setForm((prev) => ({
      ...prev,
      allowed_branches: prev.allowed_branches.includes(branch)
        ? prev.allowed_branches.filter((b) => b !== branch)
        : [...prev.allowed_branches, branch],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.company_id) return setFormError("Select a company for this drive.");
    if (!form.drive_date) return setFormError("Pick a drive date.");
    if (!form.application_deadline) return setFormError("Pick an application deadline.");
    if (form.minimum_cgpa === "") return setFormError("Enter the minimum CGPA.");
    if (form.allowed_branches.length === 0)
      return setFormError("Select at least one eligible branch.");
    // Mirror the backend's create/updateDriveSchema (server/src/lib/schema.js)
    // exactly so an invalid value shows a clear message here instead of a bare
    // 400 whose body the form can't otherwise explain.
    const cgpa = Number(form.minimum_cgpa);
    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10)
      return setFormError("Minimum CGPA must be a number between 0 and 10.");
    if (form.job_role.trim() && form.job_role.trim().length < 2)
      return setFormError("Job role must be at least 2 characters (or leave it blank).");
    if (form.job_description.trim() && form.job_description.trim().length < 10)
      return setFormError("Job description must be at least 10 characters (or leave it blank).");
    if (form.package_ctc !== "" && Number(form.package_ctc) <= 0)
      return setFormError("Package (CTC) must be greater than 0 (or leave it blank).");
    for (const [value, label] of [
      [form.max_active_backlogs, "Max active backlogs"],
      [form.max_passive_backlogs, "Max passive backlogs"],
    ] as const) {
      if (value !== "" && (!Number.isInteger(Number(value)) || Number(value) < 0))
        return setFormError(`${label} must be a whole number (0 or more), or leave it blank.`);
    }

    setFormError(undefined);
    const payload = toCreatePayload(form);

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, payload },
        {
          onSuccess: (data) => {
            setOpen(false);
            setReview({
              driveId: data.drive.drive_id,
              label: driveLabel(data.drive),
              eligibleStudents: data.eligibleStudents,
              note: "Eligibility criteria changed, so the previous shortlist was cleared. Review and confirm the new list.",
            });
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => {
          setOpen(false);
          setForm(EMPTY_FORM);
          setReview({
            driveId: data.drive.drive_id,
            label: driveLabel(data.drive),
            eligibleStudents: data.eligibleStudents,
          });
        },
      });
    }
  }

  return (
    <>
      <Topbar
        title="Placement & internship drives"
        subtitle="Create a drive, review the eligible students, and confirm the shortlist."
      />
      <PageContainer>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Drives</h2>
          <Button type="button" onClick={openCreate}>
            <Plus /> Create drive
          </Button>
        </div>

        {isLoading && <LoadingState label="Loading drives..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load drives."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!drives || drives.length === 0) && (
          <EmptyState
            icon={<Megaphone />}
            title="No drives announced yet"
            description="Create a drive to start filtering eligible students."
          />
        )}

        {!isLoading && !isError && drives && drives.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {drives.map((drive) => (
              <Card key={drive.drive_id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <CardTitle className="min-w-0 truncate text-base">
                    {driveLabel(drive)}
                  </CardTitle>
                  <StatusBadge tone={statusTone(drive.status)}>{drive.status}</StatusBadge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {drive.job_description && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {drive.job_description}
                    </p>
                  )}
                  <InfoGrid
                    items={[
                      ["Company", companyNameById.get(drive.company_id) ?? `#${drive.company_id}`],
                      ["Type", drive.employment_type],
                      ["Package (LPA)", drive.package_ctc ?? "—"],
                      ["Min CGPA", String(drive.minimum_cgpa)],
                      ["Drive date", formatDate(drive.drive_date)],
                      ["Deadline", formatDate(drive.application_deadline)],
                      ["Max active backlogs", String(drive.max_active_backlogs)],
                      ["Max passive backlogs", String(drive.max_passive_backlogs)],
                      ["Branches", drive.allowed_branches?.join(", ") || "—"],
                    ]}
                  />
                </CardContent>
                <CardFooter className="justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(drive)}
                  >
                    <Pencil /> Edit
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${driveBasePath}/${drive.drive_id}`}>
                      Manage shortlist <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit drive" : "Create drive"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" htmlFor="company">
                <Select
                  value={form.company_id}
                  onValueChange={(value) => setForm({ ...form, company_id: value })}
                >
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((c) => (
                      <SelectItem key={c.company_id} value={String(c.company_id)}>
                        {c.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Employment type" htmlFor="employment_type">
                <Select
                  value={form.employment_type}
                  onValueChange={(value) =>
                    setForm({ ...form, employment_type: value as EmploymentType })
                  }
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Job role" htmlFor="job_role">
                <Input
                  id="job_role"
                  value={form.job_role}
                  onChange={(e) => setForm({ ...form, job_role: e.target.value })}
                />
              </Field>
              <Field label="Package (CTC, LPA)" htmlFor="package_ctc">
                <Input
                  id="package_ctc"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.package_ctc}
                  onChange={(e) => setForm({ ...form, package_ctc: e.target.value })}
                />
              </Field>
              <Field label="Drive date" htmlFor="drive_date">
                <Input
                  id="drive_date"
                  type="date"
                  value={form.drive_date}
                  onChange={(e) => setForm({ ...form, drive_date: e.target.value })}
                />
              </Field>
              <Field label="Application deadline" htmlFor="application_deadline">
                <Input
                  id="application_deadline"
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                />
              </Field>
              <Field label="Minimum CGPA" htmlFor="minimum_cgpa">
                <Input
                  id="minimum_cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.minimum_cgpa}
                  onChange={(e) => setForm({ ...form, minimum_cgpa: e.target.value })}
                />
              </Field>
              <Field label="Max active backlogs" htmlFor="max_active_backlogs">
                <Input
                  id="max_active_backlogs"
                  type="number"
                  min="0"
                  value={form.max_active_backlogs}
                  onChange={(e) => setForm({ ...form, max_active_backlogs: e.target.value })}
                />
              </Field>
              <Field label="Max passive backlogs" htmlFor="max_passive_backlogs">
                <Input
                  id="max_passive_backlogs"
                  type="number"
                  min="0"
                  value={form.max_passive_backlogs}
                  onChange={(e) => setForm({ ...form, max_passive_backlogs: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Job description" htmlFor="job_description">
              <Input
                id="job_description"
                placeholder="Role details, responsibilities, location..."
                value={form.job_description}
                onChange={(e) => setForm({ ...form, job_description: e.target.value })}
              />
            </Field>

            <div className="flex flex-col gap-2">
              <Label>Eligible branches</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border p-3">
                {DEPARTMENTS.map((dept) => (
                  <label key={dept} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.allowed_branches.includes(dept)}
                      onCheckedChange={() => toggleBranch(dept)}
                    />
                    {dept}
                  </label>
                ))}
              </div>
            </div>

            {(formError || mutation.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {formError ? (
                    formError
                  ) : mutation.error?.fieldErrors ? (
                    <ul className="list-disc space-y-0.5 pl-4">
                      {Object.entries(mutation.error.fieldErrors).map(
                        ([field, messages]) => (
                          <li key={field}>{messages.join(", ")}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    mutation.error?.message
                  )}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                    ? "Save & review shortlist"
                    : "Create & review shortlist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ShortlistReviewDialog
        open={review !== null}
        onOpenChange={(next) => {
          if (!next) setReview(null);
        }}
        driveId={review?.driveId}
        driveLabel={review?.label}
        eligibleStudents={review?.eligibleStudents ?? []}
        note={review?.note}
      />
    </>
  );
}
