import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, XCircle } from "lucide-react";

import Topbar from "../../components/Topbar";
import { ErrorState, LoadingState, StatCard } from "../../components/ui";
import { useTpcQueue, useTpcSpcVerified, useTpcStudents } from "../../hooks/useVerification";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /TPC - overview for the Training & Placement Coordinator, scoped to
 * their own department: how many students are awaiting their final review, how
 * many the SPC bounced back, and the department total. Links into each section.
 */
export default function TpcDashboard() {
  const students = useTpcStudents();
  const queue = useTpcQueue();
  const awaiting = useTpcSpcVerified();

  if (students.isLoading) {
    return (
      <>
        <Topbar title="TPC overview" subtitle="Your department's verification pipeline." />
        <div className="dashboard-content">
          <LoadingState label="Loading your department..." />
        </div>
      </>
    );
  }

  if (students.isError) {
    return (
      <>
        <Topbar title="TPC overview" subtitle="" />
        <div className="dashboard-content">
          <ErrorState
            message={students.error?.message ?? "Could not load your department."}
            onRetry={students.refetch}
          />
        </div>
      </>
    );
  }

  const total = students.data?.length ?? 0;
  const rejectedCount = queue.data?.length ?? 0;
  const awaitingCount = awaiting.data?.length ?? 0;

  return (
    <>
      <Topbar title="TPC overview" subtitle="Your department's verification pipeline." />
      <div className="dashboard-content">
        <div className="stats-row admin">
          <StatCard
            label="Awaiting TPC review"
            value={String(awaitingCount)}
            note="SPC-verified + coordinators"
            icon={<CheckCircle2 />}
            tone="amber"
          />
          <StatCard
            label="Rejected by SPC"
            value={String(rejectedCount)}
            note="In your verification queue"
            icon={<XCircle />}
            tone="red"
          />
          <StatCard
            label="Department students"
            value={String(total)}
            note="Total in your department"
            icon={<Users />}
            tone="blue"
          />
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Quick links</h2>
          </div>
          <div className="quick-links">
            <Link className="text-btn" to={paths.tpcVerification}>
              Verification queue <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcSpcVerified}>
              Awaiting TPC verification <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcStudents}>
              Students <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcSpc}>
              SPC assignment <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
