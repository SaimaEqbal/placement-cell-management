import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Search } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useSpcQueue } from "../../hooks/useVerification";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /SPC/verification - the students the TPC assigned to this SPC that
 * are still awaiting review (GET /spc/verification-queue: assigned_spc_id = me
 * AND review_status = 'pending'). Verifying/rejecting from the detail page
 * removes them from this list.
 */
export default function SpcVerificationQueuePage() {
  const { data: students, isLoading, isError, error, refetch } = useSpcQueue();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);
  const total = students?.length ?? 0;

  return (
    <>
      <Topbar title="Verification queue" subtitle="Students assigned to you, awaiting SPC review." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading verification queue..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load your queue."} onRetry={refetch} />
        )}

        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={<ClipboardCheck size={28} />}
            title="No students assigned yet"
            description="Your TPC hasn't assigned students to you for verification, or you've reviewed them all."
          />
        )}

        {!isLoading && !isError && total > 0 && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">SPC verification</div>
                <h2>Student verification queue</h2>
                <p>{total} student(s) assigned to you.</p>
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
            </div>
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
                    <Badge tone="amber">Awaiting review</Badge>
                  </span>
                  <span>
                    <Link
                      className="row-action"
                      to={`${paths.spcVerification}/${s.id}`}
                      state={{ ids, backPath: paths.spcVerification }}
                    >
                      Review <ArrowRight size={15} />
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
