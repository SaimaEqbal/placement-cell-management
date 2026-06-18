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
import type { CompanyRecord, CreateCompanyPayload } from "../../services/companyService";

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

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(company: CompanyRecord) {
    setEditingId(company.company_id);
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
    if (!form.company_name.trim()) return;

    if (editingId !== null) {
      updateMutation.mutate(
        { id: editingId, payload: form },
        { onSuccess: () => setShowForm(false) },
      );
    } else {
      createMutation.mutate(form, { onSuccess: () => setShowForm(false) });
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
                {mutation.isError && <span className="field-error">{mutation.error.message}</span>}
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
                  <div className="info-grid">
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
