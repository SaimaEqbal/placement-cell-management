import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, Megaphone, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { ErrorState, LoadingState, StatCard } from "../../components/ui";
import { useCompanies } from "../../hooks/useCompanies";
import { useStudents } from "../../hooks/useStudents";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /Admin - UPC/Admin overview combining GET /students and GET
 * /companies (each through their own TanStack Query hook), giving a
 * snapshot of the placement cell's overall numbers before drilling into
 * Companies/Drives/Students.
 */
export default function AdminDashboard() {
  const students = useStudents();
  const companies = useCompanies();

  const isLoading = students.isLoading || companies.isLoading;
  const isError = students.isError || companies.isError;

  if (isLoading) {
    return (
      <>
        <Topbar title="Placement cell overview" subtitle="Companies, drives, and student placement at a glance." />
        <div className="dashboard-content">
          <LoadingState label="Loading overview..." />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Topbar title="Placement cell overview" subtitle="" />
        <div className="dashboard-content">
          <ErrorState
            message={students.error?.message ?? companies.error?.message ?? "Could not load the overview."}
            onRetry={() => {
              students.refetch();
              companies.refetch();
            }}
          />
        </div>
      </>
    );
  }

  const studentList = students.data ?? [];
  const placedCount = studentList.filter((s) => s.placement_status === "placed").length;

  return (
    <>
      <Topbar title="Placement cell overview" subtitle="Companies, drives, and student placement at a glance." />
      <div className="dashboard-content">
        <div className="stats-row admin">
          <StatCard
            label="Total students"
            value={String(studentList.length)}
            note="Across all departments"
            icon={<Users />}
            tone="blue"
          />
          <StatCard
            label="Placed"
            value={String(placedCount)}
            note={`${studentList.length ? Math.round((placedCount / studentList.length) * 100) : 0}% of students`}
            icon={<CheckCircle2 />}
            tone="green"
          />
          <StatCard
            label="Companies engaged"
            value={String(companies.data?.length ?? 0)}
            note="Currently on file"
            icon={<Building2 />}
            tone="amber"
          />
          <StatCard
            label="Active drives"
            value={String(companies.data?.length ?? 0)}
            note="One drive per company on record"
            icon={<Megaphone />}
            tone="gray"
          />
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Quick links</h2>
          </div>
          <div className="quick-links">
            <Link className="text-btn" to={paths.adminCompanies}>
              Manage companies <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.adminDrives}>
              Manage drives <ArrowRight size={15} />
            </Link>
            <Link className="text-btn" to={paths.adminStudents}>
              Filter & shortlist students <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
