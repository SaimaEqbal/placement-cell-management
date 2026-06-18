import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardCheck, Users, XCircle } from "lucide-react";

import Topbar from "../../components/Topbar";
import { ErrorState, LoadingState, StatCard } from "../../components/ui";
import { useStudents } from "../../hooks/useStudents";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /SPC - overview stats for the Student Placement Coordinator,
 * derived client-side from GET /students (useStudents -> studentService ->
 * TanStack Query). The `review_status` breakdown below is best-effort: see
 * studentService.ts's StudentRecord.review_status note - the backend's
 * updateStudentSchema currently drops that field on PUT /students/:id and
 * PUT /spc/:id, so every record may show as "pending" until that's fixed
 * server-side. Counts still reflect whatever `review_status` values do make
 * it into the database (e.g. via direct seed/migration data).
 */
export default function SpcDashboard() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();

  if (isLoading) {
    return (
      <>
        <Topbar title="Verification overview" subtitle="Review student records and keep approvals moving." />
        <div className="dashboard-content">
          <LoadingState label="Loading students..." />
        </div>
      </>
    );
  }

  if (isError || !students) {
    return (
      <>
        <Topbar title="Verification overview" subtitle="" />
        <div className="dashboard-content">
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        </div>
      </>
    );
  }

  const pending = students.filter((s) => !s.review_status || s.review_status === "pending").length;
  const verified = students.filter((s) => s.review_status && s.review_status !== "pending").length;
  const rejected = students.filter((s) => s.review_status === "rejected").length;

  return (
    <>
      <Topbar title="Verification overview" subtitle="Review student records and keep approvals moving." />
      <div className="dashboard-content">
        <div className="stats-row admin">
          <StatCard
            label="Awaiting review"
            value={String(pending)}
            note="Records not yet reviewed"
            icon={<ClipboardCheck />}
            tone="amber"
          />
          <StatCard
            label="Reviewed"
            value={String(verified)}
            note="Moved past pending"
            icon={<CheckCircle2 />}
            tone="green"
          />
          <StatCard
            label="Rejected"
            value={String(rejected)}
            note="Need resubmission"
            icon={<XCircle />}
            tone="red"
          />
          <StatCard
            label="Total students"
            value={String(students.length)}
            note="Across all departments"
            icon={<Users />}
            tone="blue"
          />
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Quick links</h2>
          </div>
          <div className="quick-links">
            <Link className="text-btn" to={paths.spcStudents}>
              View all students <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.spcVerification}>
              Go to verification queue <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
