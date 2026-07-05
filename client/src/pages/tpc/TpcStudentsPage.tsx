import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useTpcStudents } from "../../hooks/useVerification";
import { formatCgpa, initialsFromName } from "../../lib/format";
import { reviewStatusLabel, reviewStatusTone } from "../../lib/reviewStatus";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /TPC/students - every student in the TPC's department, searchable by
 * roll number. Each row opens the management detail view (promote to SPC /
 * demote / delete). SPC coordinators are tagged.
 */
export default function TpcStudentsPage() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading, isError, error, refetch } = useTpcStudents();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.roll_no.toLowerCase().includes(term) || s.name.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);

  return (
    <>
      <Topbar title="Students" subtitle="Everyone in your department. Search by roll number." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <section className="panel queue-panel">
            <div className="queue-head">
              <div>
                <div className="eyebrow">Department roster</div>
                <h2>Students</h2>
                <p>{(students ?? []).length} student(s) in your department.</p>
              </div>
            </div>
            <div className="table-tools">
              <div className="searchbox">
                <Search size={17} />
                <input
                  placeholder="Search by roll number or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Users size={28} />}
                title="No students found"
                description="Try a different roll number."
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
                        <Badge tone="blue">SPC</Badge>
                      ) : (
                        <Badge tone={reviewStatusTone(s.review_status)}>
                          {reviewStatusLabel(s.review_status)}
                        </Badge>
                      )}
                    </span>
                    <span>
                      <Link
                        className="row-action"
                        to={`${paths.tpcStudents}/${s.id}`}
                        state={{ ids, backPath: paths.tpcStudents }}
                      >
                        Manage <ArrowRight size={15} />
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
