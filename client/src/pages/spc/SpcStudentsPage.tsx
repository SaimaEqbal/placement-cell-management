import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useStudents } from "../../hooks/useStudents";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/** Purpose: map a student's review_status (best-effort, see SpcDashboard's note) to a <Badge> tone + label. */
function reviewBadge(status: string | null) {
  if (!status || status === "pending") return { tone: "amber" as const, label: "Pending" };
  if (status === "rejected") return { tone: "red" as const, label: "Rejected" };
  return { tone: "green" as const, label: "Reviewed" };
}

/**
 * Purpose: /SPC/students - the full student roster (GET /students via
 * useStudents), with client-side search by name/roll number. Each row links
 * to the verification detail screen for that student.
 */
export default function SpcStudentsPage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!students) return [];
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [students, search]);

  return (
    <>
      <Topbar title="Students" subtitle="Every student record currently on file." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">Student roster</div>
                <h2>All students</h2>
                <p>{filtered.length} of {students?.length ?? 0} records shown.</p>
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

            {filtered.length === 0 ? (
              <EmptyState title="No matching students" description="Try a different search term." icon={<Search size={24} />} />
            ) : (
              <div className="data-table">
                <div className="data-row data-head">
                  <span>Student</span>
                  <span>Branch</span>
                  <span>CGPA</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {filtered.map((s) => {
                  const badge = reviewBadge(s.review_status);
                  return (
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
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </span>
                      <span>
                        <Link className="row-action" to={`${paths.spcVerification}/${s.id}`}>
                          Review <ArrowRight size={15} />
                        </Link>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
