import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, FileText } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState, StatCard } from "../../components/ui";
import { useProfile } from "../../hooks/useProfile";
import { capitalize, formatCgpa, initialsFromName } from "../../lib/format";
import { computeProfileCompletion } from "../../lib/profileCompletion";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /Student - the student's own overview. Fetches GET /students/me
 * exclusively through useProfile() (studentService -> useProfile ->
 * TanStack Query); this component never imports axios, per project rules.
 * Displays exactly the fields the brief calls for: Name, Roll Number,
 * Branch, CGPA, Placement Status, Profile Completion Percentage.
 */
export default function StudentDashboard() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  // A 404 from GET /students/me means "hasn't completed their profile yet" -
  // route that to a call-to-action, not a scary error screen.
  const profileIncomplete = error?.status === 404;

  if (isLoading) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="Loading your profile..." />
        <div className="dashboard-content">
          <LoadingState label="Loading your profile..." />
        </div>
      </>
    );
  }

  if (profileIncomplete) {
    return (
      <>
        <Topbar title="Welcome" subtitle="Let's finish setting up your profile" />
        <div className="dashboard-content">
          <EmptyState
            icon={<FileText size={28} />}
            title="Your profile isn't complete yet"
            description="Add your academic details and documents so the placement cell can review you."
          />
          <div className="empty-state-action">
            <Link className="primary" to={paths.studentCompleteProfile}>
              Complete your profile <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (isError || !profile) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="" />
        <div className="dashboard-content">
          <ErrorState
            message={error?.message ?? "Could not load your profile."}
            onRetry={refetch}
          />
        </div>
      </>
    );
  }

  const completion = computeProfileCompletion(profile);
  const initials = initialsFromName(profile.name);
  const firstName = profile.name.split(" ")[0] || profile.name;

  return (
    <>
      <Topbar title={`Welcome, ${firstName}`} subtitle="" initials={initials} />
      <div className="dashboard-content">
        <section className="welcome-card">
          <div>
            <div className="eyebrow light">Student profile</div>
            <h2>Placement profile overview</h2>
            <p>
              Keep your academic details, marksheets, and backlog information ready for
              placement cell review.
            </p>
            <div className="profile-chips">
              <span>{profile.roll_no}</span>
              <span>{profile.branch ?? "Branch not set"}</span>
            </div>
          </div>
          <div
            className="score-ring"
            style={{ background: `conic-gradient(#9ed6c8 ${completion}%, #ffffff15 0)` }}
          >
            <div>
              <strong>{formatCgpa(profile.cgpa)}</strong>
              <span>CGPA</span>
            </div>
          </div>
        </section>

        <div className="stats-row">
          <StatCard
            label="Placement status"
            value={capitalize(profile.placement_status)}
            note="Updated by the placement cell"
            icon={<CheckCircle2 />}
            tone={profile.placement_status === "placed" ? "green" : "blue"}
          />
          <StatCard
            label="Active backlogs"
            value={String(profile.active_backlogs)}
            note={`${profile.passive_backlogs} cleared previously`}
            icon={<BookOpen />}
            tone={profile.active_backlogs > 0 ? "amber" : "green"}
          />
          <StatCard
            label="Profile completion"
            value={`${completion}%`}
            note={completion === 100 ? "All fields complete" : "Some fields still missing"}
            icon={<FileText />}
            tone={completion === 100 ? "green" : "amber"}
          />
        </div>

        <div className="two-column">
          <section className="panel">
            <div className="panel-head">
              <h2>Verification status</h2>
            </div>
            <div className="panel-body">
              <Badge tone={profile.review_status === "verified" ? "green" : "amber"}>
                {capitalize(profile.review_status ?? "pending")}
              </Badge>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Quick links</h2>
            </div>
            <div className="quick-links">
              <Link className="text-btn" to={paths.studentProfile}>
                View full profile <ArrowRight size={15} />
              </Link>
              <Link className="text-btn" to={paths.studentDrives}>
                Browse placement drives <ArrowRight size={15} />
              </Link>
              <Link className="text-btn" to={paths.studentCompleteProfile}>
                Edit my profile <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
