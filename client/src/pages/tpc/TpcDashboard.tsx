import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Megaphone,
  Users,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { ErrorState, LoadingState, StatCard } from "../../components/ui";
import { useDrives } from "../../hooks/useDrives";
import { useStudents } from "../../hooks/useStudents";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /TPC - overview for the Teacher Placement Coordinator: how many
 * SPC-verified students are still waiting on TPC final verification, vs.
 * already fully approved. Same GET /students data source as SpcDashboard.
 */
export default function TpcDashboard() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const { data: drives } = useDrives();

  if (isLoading) {
    return (
      <>
        <Topbar title="Final verification overview" subtitle="Review SPC-verified records and finalize approvals." />
        <div className="dashboard-content">
          <LoadingState label="Loading students..." />
        </div>
      </>
    );
  }

  if (isError || !students) {
    return (
      <>
        <Topbar title="Final verification overview" subtitle="" />
        <div className="dashboard-content">
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        </div>
      </>
    );
  }

  const awaitingFinal = students.filter((s) => s.review_status === "spc_verified").length;
  const approved = students.filter((s) => s.review_status === "verified").length;

  return (
    <>
      <Topbar title="Final verification overview" subtitle="Review SPC-verified records and finalize approvals." />
      <div className="dashboard-content">
        <div className="stats-row admin">
          <StatCard
            label="Awaiting final review"
            value={String(awaitingFinal)}
            note="SPC-verified, pending TPC"
            icon={<ClipboardCheck />}
            tone="amber"
          />
          <StatCard
            label="Fully approved"
            value={String(approved)}
            note="Completed verification"
            icon={<CheckCircle2 />}
            tone="green"
          />
          <StatCard
            label="Active drives"
            value={String(drives?.length ?? 0)}
            note="Drives on record"
            icon={<Megaphone />}
            tone="blue"
          />
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Quick links</h2>
          </div>
          <div className="quick-links">
            <Link className="text-btn" to={paths.tpcCompanies}>
              Manage companies <Building2 size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcDrives}>
              Manage drives <Megaphone size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcStudents}>
              Filter & shortlist students <Users size={15} />
            </Link>
            <Link className="text-btn" to={paths.tpcVerification}>
              Go to verification queue <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
