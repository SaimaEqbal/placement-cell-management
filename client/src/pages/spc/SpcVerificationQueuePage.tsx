import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Search } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useStudents } from "../../hooks/useStudents";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /SPC/verification - students still awaiting SPC-level review
 * (review_status null/"pending"), the queue the brief's SPC Requirements
 * ("View Students, Review Uploaded Documents, Verify Student Details,
 * Approve, Reject") describe. Same GET /students data as SpcStudentsPage,
 * just pre-filtered.
 */
export default function SpcVerificationQueuePage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const [search, setSearch] = useState("");

  const pending = useMemo(
    () => (students ?? []).filter((s) => !s.review_status || s.review_status === "pending"),
    [students],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pending;
    return pending.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [pending, search]);

  return (
    <>
      <Topbar title="Verification queue" subtitle="Students awaiting SPC-level review." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading verification queue..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && pending.length === 0 && (
          <EmptyState
            icon={<ClipboardCheck size={28} />}
            title="Nothing waiting for review"
            description="Every student has already been reviewed at the SPC level."
          />
        )}

        {!isLoading && !isError && pending.length > 0 && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">SPC verification</div>
                <h2>Student verification queue</h2>
                <p>{pending.length} record(s) are waiting for your review.</p>
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
                    <Link className="row-action" to={`${paths.spcVerification}/${s.id}`}>
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
