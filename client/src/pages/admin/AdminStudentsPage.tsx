import { useMemo, useState } from "react";
import { Search, UserCheck, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCreateApplication } from "../../hooks/useApplications";
import { useCompanies } from "../../hooks/useCompanies";
import { useStudents } from "../../hooks/useStudents";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { DEPARTMENTS } from "../../lib/validation";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /Admin/students - the UPC/Admin "Filter Students" + "Shortlist
 * Students" screen from the brief's placement-cell-driven workflow (UPC
 * creates a drive -> system filters eligible students -> UPC shortlists
 * students). Filtering (branch, minimum CGPA, no-active-backlogs) happens
 * client-side over the cached GET /students list, same approach as the
 * SPC/TPC roster pages. Shortlisting calls POST /applications
 * (useCreateApplication) - per applicationService.ts's STATUS note this
 * 404s until the backend mounts that router, surfaced here as an inline
 * per-row error rather than blocking the page.
 */
export default function AdminStudentsPage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const { data: companies } = useCompanies();
  const createApplication = useCreateApplication();

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [noBacklogsOnly, setNoBacklogsOnly] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [shortlistedId, setShortlistedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!students) return [];
    const term = search.trim().toLowerCase();
    const minCgpaNum = Number(minCgpa) || 0;
    return students.filter((s) => {
      if (term && !s.name.toLowerCase().includes(term) && !s.roll_no.toLowerCase().includes(term)) {
        return false;
      }
      if (branch && s.branch !== branch) return false;
      if (minCgpaNum && Number(s.cgpa ?? 0) < minCgpaNum) return false;
      if (noBacklogsOnly && s.active_backlogs > 0) return false;
      return true;
    });
  }, [students, search, branch, minCgpa, noBacklogsOnly]);

  function handleShortlist(studentId: number) {
    if (!companyId) return;
    setShortlistedId(studentId);
    createApplication.mutate({ studentId, companyId: Number(companyId) });
  }

  return (
    <>
      <Topbar title="Students" subtitle="Filter eligible students and shortlist them for a drive." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">Eligibility filter</div>
                <h2>All students</h2>
                <p>{filtered.length} of {students?.length ?? 0} students match the current filter.</p>
              </div>
            </div>
            <div className="table-tools">
              <div className="searchbox">
                <Search size={17} />
                <input
                  placeholder="Search name or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">All departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Min CGPA"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                style={{ width: 90, border: "1px solid var(--line)", borderRadius: 7, padding: "0 10px" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                <input
                  type="checkbox"
                  checked={noBacklogsOnly}
                  onChange={(e) => setNoBacklogsOnly(e.target.checked)}
                />
                No active backlogs
              </label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Select a drive to shortlist into...</option>
                {companies?.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="No students match this filter"
                description="Try widening the branch or CGPA filter."
              />
            ) : (
              <div className="data-table">
                <div className="data-row data-head">
                  <span>Student</span>
                  <span>Branch</span>
                  <span>CGPA</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {filtered.map((s) => (
                  <div className="data-row" key={s.id}>
                    <span className="student-cell">
                      <i>{initialsFromName(s.name)}</i>
                      <span>
                        <b>{s.name}</b>
                        <small>{s.roll_no}</small>
                      </span>
                    </span>
                    <span>{s.branch ?? "-"}</span>
                    <span>
                      <b>{formatCgpa(s.cgpa)}</b>
                    </span>
                    <span>
                      <Badge tone={s.placement_status === "placed" ? "green" : "blue"}>
                        {s.placement_status}
                      </Badge>
                    </span>
                    <span>
                      <button
                        className="row-action"
                        type="button"
                        disabled={!companyId || createApplication.isPending}
                        onClick={() => handleShortlist(s.id)}
                      >
                        <UserCheck size={14} /> Shortlist
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {createApplication.isError && shortlistedId !== null && (
              <p style={{ padding: "0 24px 16px", fontSize: 10, color: "var(--red)" }}>
                Could not shortlist this student: {createApplication.error.message}
              </p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
