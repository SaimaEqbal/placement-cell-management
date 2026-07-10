import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Megaphone, MoreHorizontal, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { Field } from "@/components/dashboard/Field";
import { ShortlistReviewDialog } from "@/components/dashboard/ShortlistReviewDialog";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useCreateDrive,
  useDeleteDrive,
  useDrives,
  useUpdateDrive,
} from "../../hooks/useDrives";
import { DEPARTMENT_BRANCHES } from "../../lib/validation";
import { paths } from "../../routes/paths";
import type {
  CreateDrivePayload,
  DriveRecord,
  EligibleStudent,
  EmploymentType,
} from "../../services/driveService";

const EMPLOYMENT_TYPES: EmploymentType[] = ["FTE", "Internship", "Internship + PPO"];

/** Local form state - all inputs are strings/arrays and get coerced to the API's number/array shape on submit. */
interface DriveFormState {
  company_id: string;
  job_role: string;
  job_description: string;
  package_ctc: string;
  employment_type: EmploymentType;
  minimum_cgpa: string;
  allowed_branches: string[];
  max_active_backlogs: string;
  max_passive_backlogs: string;
}

const EMPTY_FORM: DriveFormState = {
  company_id: "",
  job_role: "",
  job_description: "",
  package_ctc: "",
  employment_type: "FTE",
  minimum_cgpa: "",
  allowed_branches: [],
  max_active_backlogs: "",
  max_passive_backlogs: "",
};

/**
 * Purpose: turn a nullable numeric column into a text-input value. Nullable
 * drive columns (package_ctc, max_active_backlogs, max_passive_backlogs) come
 * back null; String(null) would produce the literal "null", which then coerces
 * to NaN and serialises to JSON null - the exact cause of the backend's
 * "expected number, received null" 400 on edit.
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
    minimum_cgpa: numToInput(drive.minimum_cgpa),
    allowed_branches: drive.allowed_branches ?? [],
    max_active_backlogs: numToInput(drive.max_active_backlogs),
    max_passive_backlogs: numToInput(drive.max_passive_backlogs),
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
    minimum_cgpa: Number(form.minimum_cgpa),
    allowed_branches: form.allowed_branches,
  };

  /** Only forward an optional number when it parses to a finite value, so we can never serialise NaN as JSON null (which the backend rejects). */
  const setNum = (raw: string, key: "package_ctc") => {
    if (raw === "") return;
    const n = Number(raw);
    if (Number.isFinite(n)) payload[key] = n;
  };

  /**
   * Backlog caps default to 0 (the DB column default) when left blank. Omitting
   * them writes NULL, and the eligibility filter `active_backlogs <= NULL` is
   * UNKNOWN for every student - i.e. a blank cap would exclude everyone.
   */
  const setBacklog = (raw: string, key: "max_active_backlogs" | "max_passive_backlogs") => {
    const n = raw === "" ? 0 : Number(raw);
    payload[key] = Number.isFinite(n) ? n : 0;
  };

  if (form.job_role.trim()) payload.job_role = form.job_role.trim();
  if (form.job_description.trim()) payload.job_description = form.job_description.trim();
  setNum(form.package_ctc, "package_ctc");
  setBacklog(form.max_active_backlogs, "max_active_backlogs");
  setBacklog(form.max_passive_backlogs, "max_passive_backlogs");

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
  const deleteMutation = useDeleteDrive();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DriveFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();

  /** The drive pending deletion (opens the irreversible-delete confirm dialog). */
  const [deleteTarget, setDeleteTarget] = useState<DriveRecord | null>(null);

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
      /**
       * updateDrive overwrites every column, including status. The form never
       * edits status, so carry the drive's current status through - otherwise
       * the omitted field is written as NULL, wiping the drive's lifecycle state.
       */
      const editingDrive = drives?.find((d) => d.drive_id === editingId);
      updateMutation.mutate(
        {
          id: editingId,
          payload: editingDrive ? { ...payload, status: editingDrive.status } : payload,
        },
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

  const driveColumns: ColumnDef<DriveRecord>[] = [
    {
      id: "company",
      accessorFn: (d) => companyNameById.get(d.company_id) ?? `#${d.company_id}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      meta: { label: "Company" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {companyNameById.get(row.original.company_id) ?? `#${row.original.company_id}`}
          </div>
          {row.original.job_role && (
            <div className="truncate text-xs text-muted-foreground">{row.original.job_role}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "employment_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Manage drive <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                Edit drive
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`${driveBasePath}/${row.original.drive_id}`}>Manage drive</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                Delete drive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Placement & internship drives"
        subtitle="Create, manage drives"
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
          <DataTable
            columns={driveColumns}
            data={drives}
            searchPlaceholder="Search company or role .."
            enableExport
            exportFileName="drives"
          />
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
              {/* Branches are grouped under their department. allowed_branches holds
                  the branch values, which the backend matches against students.branch. */}
              <div className="flex flex-col gap-4 rounded-lg border p-3">
                {Object.entries(DEPARTMENT_BRANCHES).map(([dept, branches]) => (
                  <div key={dept} className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{dept}</p>
                    <div className="flex flex-col gap-2 pl-1">
                      {branches.map((branch) => (
                        <label key={branch} className="flex items-start gap-2 text-sm">
                          <Checkbox
                            className="mt-0.5"
                            checked={form.allowed_branches.includes(branch)}
                            onCheckedChange={() => toggleBranch(branch)}
                          />
                          {branch}
                        </label>
                      ))}
                    </div>
                  </div>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget ? driveLabel(deleteTarget) : "drive"}?`}
        description="This is irreversible. All round history will be lost, and the confirmed shortlist, every round's pre-filter / attendance / results records, and all other data for this drive will be permanently deleted."
        confirmLabel="Delete drive"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.drive_id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </>
  );
}
