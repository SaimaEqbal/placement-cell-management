import { useState, type FormEvent } from "react";
import { Megaphone, Plus, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanies, useCreateCompany } from "../../hooks/useCompanies";
import { formatDate } from "../../lib/format";
import type { CreateCompanyPayload } from "../../services/companyService";

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
 * Purpose: /Admin/drives - Create Placement/Internship Drive screen from
 * the brief's UPC/Admin Requirements.
 *
 * NOTE: the backend has no separate `drives` table/route - companies
 * (server/src/migrations/002_create_companies.sql,
 * server/src/controllers/companyController.js) are the only persisted
 * "drive" concept, and there is no eligibility-criteria column either. This
 * page is intentionally a thin, drive-flavoured view over the same GET/POST
 * /companies endpoint CompaniesPage.tsx uses (description doubles as where
 * eligibility criteria/role details would go) rather than inventing a
 * client-only data model the backend can't actually store.
 */
export default function DrivesPage() {
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();
  const createMutation = useCreateCompany();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCompanyPayload>(EMPTY_FORM);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.company_name.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
      },
    });
  }

  return (
    <>
      <Topbar title="Placement & internship drives" subtitle="Announce a new drive and track active ones." />
      <div className="dashboard-content">
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h2>{showForm ? "Create drive" : "Drives"}</h2>
            <button className="secondary" type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Cancel" : "Create drive"}
            </button>
          </div>

          {showForm && (
            <div className="panel-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <label>
                    Company / drive name
                    <input
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    />
                  </label>
                  <label>
                    Industry / role
                    <input
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    />
                  </label>
                  <label>
                    HR contact name
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
                </div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 18 }}>
                  Eligibility criteria / description
                  <input
                    style={{
                      width: "100%",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "12px 13px",
                      marginTop: 7,
                    }}
                    placeholder="e.g. CSE/ECE, CGPA 7.0+, no active backlogs"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                {createMutation.isError && (
                  <span className="field-error">{createMutation.error.message}</span>
                )}
                <div className="form-actions">
                  <p />
                  <button className="primary" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create drive"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {isLoading && <LoadingState label="Loading drives..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load drives."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!companies || companies.length === 0) && (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="No drives announced yet"
            description="Create a drive above to start filtering eligible students."
          />
        )}

        {!isLoading && !isError && companies && companies.length > 0 && (
          <section className="panel">
            <div className="panel-head">
              <h2>Active drives</h2>
            </div>
            <div className="panel-body">
              {companies.map((company) => (
                <div className="activity" key={company.company_id}>
                  <i className="blue">
                    <Megaphone size={14} />
                  </i>
                  <div>
                    <b>{company.company_name}</b>
                    <span>
                      {company.description || "No eligibility criteria set"} · Announced{" "}
                      {formatDate(company.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
