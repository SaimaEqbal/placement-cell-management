import { useState, type FormEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Plus } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field } from "@/components/dashboard/Field";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "../../hooks/useCompanies";
import type { ApiError } from "../../api/apiError";
import type { CompanyRecord, CreateCompanyPayload } from "../../services/companyService";
import { validateEmail } from "../../lib/validation";

const EMPTY_FORM: CreateCompanyPayload = {
  company_name: "",
  industry: "",
  description: "",
  hr_name: "",
  hr_email: "",
  hr_phone: "",
};

/** Flatten an ApiError's per-field validation errors into a single readable line. */
function fieldErrorText(error: ApiError): string | undefined {
  if (!error.fieldErrors) return undefined;
  const msgs = Object.entries(error.fieldErrors).flatMap(([field, list]) =>
    list.map((m) => `${field}: ${m}`),
  );
  return msgs.length ? msgs.join(" · ") : undefined;
}

/**
 * Purpose: /Admin/companies - UPC/Admin's company management CRUD in a data
 * table (Company name, Industry, and a "Manage company" action for edit/delete),
 * backed by GET/POST/PUT/DELETE /companies.
 */
export default function CompaniesPage() {
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateCompanyPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<CompanyRecord | null>(null);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(undefined);
    setOpen(true);
  }

  function openEditForm(company: CompanyRecord) {
    setEditingId(company.company_id);
    setFormError(undefined);
    setForm({
      company_name: company.company_name,
      industry: company.industry ?? "",
      description: company.description ?? "",
      hr_name: company.hr_name ?? "",
      hr_email: company.hr_email ?? "",
      hr_phone: company.hr_phone ?? "",
    });
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const company_name = form.company_name.trim();
    const industry = form.industry.trim();
    const description = form.description.trim();

    /** Mirror the backend's createCompanySchema so the user gets an inline message instead of a round-trip 400. */
    if (company_name.length < 2)
      return setFormError("Company name must be at least 2 characters.");
    if (industry.length < 2) return setFormError("Industry is required.");
    if (description.length < 10)
      return setFormError("Description must be at least 10 characters.");
    if (form.hr_email?.trim()) {
      const emailError = validateEmail(form.hr_email.trim());
      if (emailError) return setFormError(emailError);
    }
    if (form.hr_phone?.trim() && !/^\d{10,15}$/.test(form.hr_phone.trim()))
      return setFormError("HR phone must be 10-15 digits (or leave it blank).");

    setFormError(undefined);

    /**
     * Omit optional HR fields when blank: the backend's Zod schema treats an
     * empty string as an invalid value (fails min-length / email), not as "absent".
     */
    const payload: CreateCompanyPayload = { company_name, industry, description };
    if (form.hr_name?.trim()) payload.hr_name = form.hr_name.trim();
    if (form.hr_email?.trim()) payload.hr_email = form.hr_email.trim();
    if (form.hr_phone?.trim()) payload.hr_phone = form.hr_phone.trim();

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, payload }, { onSuccess: () => setOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  }

  const mutation = editingId !== null ? updateMutation : createMutation;

  const columns: ColumnDef<CompanyRecord>[] = [
    {
      accessorKey: "company_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company name" />,
      meta: { label: "Company name" },
      cell: ({ row }) => <span className="font-medium">{row.original.company_name}</span>,
    },
    {
      accessorKey: "industry",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
      meta: { label: "Industry" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.industry ?? "—"}</span>
      ),
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
                Manage company <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditForm(row.original)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Companies" subtitle="Manage the companies engaging with the placement cell." />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Companies"
            value={String(companies?.length ?? 0)}
            note="Engaged with the placement cell"
            icon={<Building2 />}
          />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Companies</h2>
          <Button type="button" onClick={openCreateForm}>
            <Plus /> Add company
          </Button>
        </div>

        {isLoading && <LoadingState label="Loading companies..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load companies."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!companies || companies.length === 0) && (
          <EmptyState
            icon={<Building2 />}
            title="No companies yet"
            description="Add the first company to get placement drives started."
          />
        )}

        {!isLoading && !isError && companies && companies.length > 0 && (
          <ListCard title="All companies" description={`${companies.length} compan${companies.length === 1 ? "y" : "ies"}.`}>
            <DataTable
              columns={columns}
              data={companies}
              searchPlaceholder="Search company or industry..."
              enableExport
              exportFileName="companies"
            />
          </ListCard>
        )}
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit company" : "Add company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" htmlFor="company_name">
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </Field>
              <Field label="Industry" htmlFor="industry">
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </Field>
              <Field label="HR name" htmlFor="hr_name">
                <Input
                  id="hr_name"
                  value={form.hr_name}
                  onChange={(e) => setForm({ ...form, hr_name: e.target.value })}
                />
              </Field>
              <Field label="HR email" htmlFor="hr_email">
                <Input
                  id="hr_email"
                  type="email"
                  value={form.hr_email}
                  onChange={(e) => setForm({ ...form, hr_email: e.target.value })}
                />
              </Field>
              <Field label="HR phone" htmlFor="hr_phone">
                <Input
                  id="hr_phone"
                  value={form.hr_phone}
                  onChange={(e) => setForm({ ...form, hr_phone: e.target.value })}
                />
              </Field>
              <Field label="Description" htmlFor="description" className="sm:col-span-2">
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>

            {(formError || mutation.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {formError ??
                    (mutation.error
                      ? fieldErrorText(mutation.error) ?? mutation.error.message
                      : undefined)}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Add company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete this company?"
        description={
          deleteTarget
            ? `"${deleteTarget.company_name}" will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.company_id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
