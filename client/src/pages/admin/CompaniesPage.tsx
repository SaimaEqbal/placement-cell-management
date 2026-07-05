import { useState, type FormEvent } from "react";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "../../hooks/useCompanies";
import type { ApiError } from "../../api/apiError";
import type { CompanyRecord, CreateCompanyPayload } from "../../services/companyService";
import { formatDate } from "../../lib/format";

import "../../styles/dashboard.css";
import "../../styles/form-wizard.css";

const EMPTY_FORM: CreateCompanyPayload = {
  company_name: "",
  industry: "",
  description: "",
  hr_name: "",
  hr_email: "",
  hr_phone: "",
};

/**
 * Purpose: flatten an ApiError's per-field validation errors (from the backend's
 * Zod schema) into a single readable line, so the form shows "industry: Industry
 * is required" instead of a generic "Request failed (400)".
 */
function fieldErrorText(error: ApiError): string | undefined {
  if (!error.fieldErrors) return undefined;
  const msgs = Object.entries(error.fieldErrors).flatMap(([field, list]) =>
    list.map((m) => `${field}: ${m}`),
  );
  return msgs.length ? msgs.join(" · ") : undefined;
}

/**
 * Purpose: /Admin/companies - UPC/Admin's company management CRUD (Add,
 * Edit, Delete Company per the brief), backed by GET/POST/PUT/DELETE
 * /companies via useCompanies/useCreateCompany/useUpdateCompany/
 * useDeleteCompany.
 */
export default function CompaniesPage() {
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateCompanyPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string>();

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(undefined);
    setShowForm(true);
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
    setShowForm(true);
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
    if (form.hr_phone?.trim() && !/^\d{10,15}$/.test(form.hr_phone.trim()))
      return setFormError("HR phone must be 10-15 digits (or leave it blank).");

    setFormError(undefined);

    /**
     * Omit optional HR fields when blank: the backend's Zod schema treats an
     * empty string as an invalid value (fails min-length / email), not as
     * "absent". Sending "" for an unfilled HR field is what was causing the 400.
     */
    const payload: CreateCompanyPayload = { company_name, industry, description };
    if (form.hr_name?.trim()) payload.hr_name = form.hr_name.trim();
    if (form.hr_email?.trim()) payload.hr_email = form.hr_email.trim();
    if (form.hr_phone?.trim()) payload.hr_phone = form.hr_phone.trim();

    if (editingId !== null) {
      updateMutation.mutate(
        { id: editingId, payload },
        { onSuccess: () => setShowForm(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  }

  const mutation = editingId !== null ? updateMutation : createMutation;

  return (
    <>
      <Topbar title="Companies" subtitle="Manage the companies engaging with the placement cell." />
      <div className="dashboard-content">
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h2>{showForm ? (editingId !== null ? "Edit company" : "Add company") : "Companies"}</h2>
            <button className="secondary" type="button" onClick={() => (showForm ? setShowForm(false) : openCreateForm())}>
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Cancel" : "Add company"}
            </button>
          </div>

          {showForm && (
            <div className="panel-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <label>
                    Company name
                    <input
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    />
                  </label>
                  <label>
                    Industry
                    <input
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                  </label>
                  <label>
                    HR name
                    <input
                      value={form.hr_name}
                      onChange={(e) => setForm({ ...form, hr_name: e.target.value })}
                    />
                  </label>
                  <label>
                    HR email
                    <input
                      type="email"
                      value={form.hr_email}
                      onChange={(e) => setForm({ ...form, hr_email: e.target.value })}
                    />
                  </label>
                  <label>
                    HR phone
                    <input
                      value={form.hr_phone}
                      onChange={(e) => setForm({ ...form, hr_phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </label>
                </div>
                {formError && <span className="field-error">{formError}</span>}
                {mutation.isError && (
                  <span className="field-error">
                    {fieldErrorText(mutation.error) ?? mutation.error.message}
                  </span>
                )}
                <div className="form-actions">
                  <p />
                  <button className="primary" type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingId !== null ? "Save changes" : "Add company"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {isLoading && <LoadingState label="Loading companies..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load companies."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!companies || companies.length === 0) && (
          <EmptyState
            icon={<Building2 size={28} />}
            title="No companies yet"
            description="Add the first company to get placement drives started."
          />
        )}

        {!isLoading && !isError && companies && companies.length > 0 && (
          <div className="two-column">
            {companies.map((company) => (
              <section className="panel" key={company.company_id}>
                <div className="panel-head">
                  <h2>{company.company_name}</h2>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" type="button" onClick={() => openEditForm(company)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(company.company_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: 12, marginBottom: 12, whiteSpace: "pre-wrap" }}>
                    {company.description ?? "No description provided."}
                  </p>
                  <div className="info-grid">
                    <div>
                      <span>Company ID</span>
                      <b>{company.company_id}</b>
                    </div>
                    <div>
                      <span>Industry</span>
                      <b>{company.industry ?? "-"}</b>
                    </div>
                    <div>
                      <span>HR contact</span>
                      <b>{company.hr_name ?? "-"}</b>
                    </div>
                    <div>
                      <span>HR email</span>
                      <b>{company.hr_email ?? "-"}</b>
                    </div>
                    <div>
                      <span>HR phone</span>
                      <b>{company.hr_phone ?? "-"}</b>
                    </div>
                    <div>
                      <span>Created</span>
                      <b>{formatDate(company.created_at)}</b>
                    </div>
                    <div>
                      <span>Created by</span>
                      <b>{company.created_by ?? "-"}</b>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
