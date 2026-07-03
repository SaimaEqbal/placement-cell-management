import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useTpcBranches, useTpcSpcVerified } from "../../hooks/useVerification";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /TPC/spc-verified - the TPC's final-review list. Contains students
 * an SPC verified (review_status = 'spc_verified') PLUS SPC coordinators' own
 * profiles (they skip peer review - see the `is_spc` tag). Rows open the same
 * verify/reject detail as the verification queue.
 */
export default function TpcSpcVerifiedPage() {
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcSpcVerified(
    branch || undefined,
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);

  return (
    <>
      <Topbar title="Awaiting TPC verification" subtitle="SPC-verified students and SPC coordinators, ready for your final review." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">TPC final review</div>
                <h2>Awaiting TPC verification</h2>
                <p>
                  {(students ?? []).length} student(s) ready for final approval
                  {branch ? ` in ${branch}` : ""}.
                </p>
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
              <select
                className="filter-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">All branches</option>
                {(branches ?? []).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={28} />}
                title="Nothing awaiting final review"
                description="No SPC-verified students or coordinators in this view."
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
                      {s.is_spc ? (
                        <Badge tone="blue">SPC coordinator</Badge>
                      ) : (
                        <Badge tone="green">SPC verified</Badge>
                      )}
                    </span>
                    <span>
                      <Link
                        className="row-action"
                        to={`${paths.tpcVerification}/${s.id}`}
                        state={{ ids, backPath: paths.tpcSpcVerified }}
                      >
                        Review <ArrowRight size={15} />
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
