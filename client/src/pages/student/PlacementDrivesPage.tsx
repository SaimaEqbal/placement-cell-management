import { Briefcase, Mail, Phone, User } from "lucide-react";

import Topbar from "../../components/Topbar";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanies } from "../../hooks/useCompanies";

import "../../styles/dashboard.css";

/**
 * Purpose: /Student/drives - lists companies/placement drives via GET
 * /companies (useCompanies -> companyService -> TanStack Query; never
 * axios directly). Per the brief ("Application workflow may remain TODO")
 * this page only displays drives - there is no apply/shortlist action here,
 * matching the placement-cell-driven workflow (UPC shortlists, students
 * don't apply).
 */
export default function PlacementDrivesPage() {
  const { data: companies, isLoading, isError, error, refetch } = useCompanies();

  return (
    <>
      <Topbar title="Placement drives" subtitle="Companies currently engaging with the placement cell." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading placement drives..." />}

        {isError && (
          <ErrorState message={error?.message ?? "Could not load placement drives."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!companies || companies.length === 0) && (
          <EmptyState
            icon={<Briefcase size={28} />}
            title="No placement drives yet"
            description="The placement cell hasn't announced any companies yet. Check back soon."
          />
        )}

        {!isLoading && !isError && companies && companies.length > 0 && (
          <div className="two-column">
            {companies.map((company) => (
              <section className="panel" key={company.company_id}>
                <div className="panel-head">
                  <h2>{company.company_name}</h2>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                    {company.description ?? "No description provided."}
                  </p>
                  <div className="info-grid">
                    <div>
                      <span>Industry</span>
                      <b>{company.industry ?? "-"}</b>
                    </div>
                    <div>
                      <span>
                        <User size={11} /> HR contact
                      </span>
                      <b>{company.hr_name ?? "-"}</b>
                    </div>
                    <div>
                      <span>
                        <Mail size={11} /> HR email
                      </span>
                      <b>{company.hr_email ?? "-"}</b>
                    </div>
                    <div>
                      <span>
                        <Phone size={11} /> HR phone
                      </span>
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
