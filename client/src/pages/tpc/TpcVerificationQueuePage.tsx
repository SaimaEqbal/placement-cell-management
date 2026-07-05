import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Search } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useTpcBranches, useTpcQueue } from "../../hooks/useVerification";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /TPC/verification - students an SPC rejected (review_status =
 * 'spc_rejected'), now awaiting TPC review, with the SPC's reason shown inline.
 * Filterable by branch (branches under the TPC's department).
 */
export default function TpcVerificationQueuePage() {
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcQueue(
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
      <Topbar title="Verification queue" subtitle="Students rejected by an SPC, awaiting your review." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading verification queue..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load the queue."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">TPC verification</div>
                <h2>SPC-rejected students</h2>
                <p>
                  {(students ?? []).length} student(s) awaiting your review
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
                icon={<ClipboardCheck size={28} />}
                title="Nothing waiting for review"
                description="No SPC-rejected students in this view."
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
                        {s.rejection_reason && (
                          <small className="reason-line">SPC: {s.rejection_reason}</small>
                        )}
                      </span>
                    </span>
                    <span>{s.branch ?? "-"}</span>
                    <span>
                      <b>{formatCgpa(s.cgpa)}</b>
                    </span>
                    <span>
                      <Badge tone="red">SPC rejected</Badge>
                    </span>
                    <span>
                      <Link
                        className="row-action"
                        to={`${paths.tpcVerification}/${s.id}`}
                        state={{ ids, backPath: paths.tpcVerification }}
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
