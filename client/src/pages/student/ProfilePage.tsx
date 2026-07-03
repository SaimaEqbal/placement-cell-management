import { Link } from "react-router-dom";
import { Edit3, FileText } from "lucide-react";

import Topbar from "../../components/Topbar";
import { ErrorState, InfoGrid, LoadingState } from "../../components/ui";
import { useProfile } from "../../hooks/useProfile";
import { capitalize, formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/dashboard.css";

/**
 * Purpose: /Student/profile - read-only view of the student's own record.
 * Calls the same useProfile() hook (same ['students','me'] query key) as
 * StudentDashboard, so if the dashboard already loaded the profile this
 * page renders instantly from cache instead of firing a second request -
 * per the brief's "must reuse cached profile data, do not trigger duplicate
 * requests" requirement for this page.
 */
export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <>
        <Topbar title="My profile" subtitle="" />
        <div className="dashboard-content">
          <LoadingState label="Loading your profile..." />
        </div>
      </>
    );
  }

  if (isError || !profile) {
    const isIncomplete = error?.status === 404;
    return (
      <>
        <Topbar title="My profile" subtitle="" />
        <div className="dashboard-content">
          <ErrorState
            message={
              isIncomplete
                ? "You haven't completed your profile yet."
                : error?.message ?? "Could not load your profile."
            }
            onRetry={isIncomplete ? undefined : refetch}
          />
          {isIncomplete && (
            <div className="empty-state-action">
              <Link className="primary" to={paths.studentCompleteProfile}>
                Complete your profile
              </Link>
            </div>
          )}
        </div>
      </>
    );
  }

  /** Per-semester SPIs, showing only the semesters the student has filled in. */
  const spiItems: [string, string][] = [
    profile.sem1_spi,
    profile.sem2_spi,
    profile.sem3_spi,
    profile.sem4_spi,
    profile.sem5_spi,
    profile.sem6_spi,
    profile.sem7_spi,
    profile.sem8_spi,
  ].reduce<[string, string][]>((acc, value, i) => {
    if (value != null && value !== "") acc.push([`Semester ${i + 1}`, String(value)]);
    return acc;
  }, []);

  return (
    <>
      <Topbar
        title="My profile"
        subtitle={profile.roll_no}
        initials={initialsFromName(profile.name)}
      />
      <div className="dashboard-content">
        <section className="panel">
          <div className="panel-head">
            <h2>Personal &amp; academic details</h2>
            <Link className="text-btn" to={paths.studentCompleteProfile}>
              <Edit3 size={14} /> Edit
            </Link>
          </div>
          <div className="panel-body">
            <InfoGrid
              items={[
                ["Full name", profile.name],
                ["Roll number", profile.roll_no],
                ["Email", profile.email],
                ["Phone", profile.phone ?? "-"],
                ["Department", profile.department ?? "-"],
                ["Branch", profile.branch ?? "-"],
                [
                  "Graduation year",
                  profile.graduation_year ? String(profile.graduation_year) : "-",
                ],
                ["Current semester", profile.semester ? String(profile.semester) : "-"],
                ["CGPA", formatCgpa(profile.cgpa)],
                ["10th percentage", profile.tenth_percentage ?? "-"],
                ["12th percentage", profile.twelfth_percentage ?? "-"],
                ["Gender", profile.gender ?? "-"],
                ["Region", profile.region ?? "-"],
                ["Religion", profile.religion ?? "-"],
                ["Date of birth", formatDate(profile.date_of_birth)],
                ["Active backlogs", String(profile.active_backlogs)],
                ["Passive backlogs", String(profile.passive_backlogs)],
                ["Placement status", capitalize(profile.placement_status)],
                ["Verification status", capitalize(profile.review_status ?? "pending")],
              ]}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Documents</h2>
          </div>
          <div className="doc-list">
            <DocumentLink label="Resume" url={profile.resume_url} />
            <DocumentLink label="10th marksheet" url={profile.tenth_marksheet_url} />
            <DocumentLink label="12th marksheet" url={profile.twelfth_marksheet_url} />
            <DocumentLink label="Latest semester marksheet" url={profile.last_sem_marksheet_url} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Semester SPIs</h2>
          </div>
          <div className="panel-body">
            {spiItems.length > 0 ? (
              <InfoGrid items={spiItems} />
            ) : (
              <p style={{ fontSize: 12, color: "var(--muted)" }}>No SPIs recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/** Purpose: one row in the Documents panel - shows upload state, links out to the stored URL when present. */
function DocumentLink({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="document-item">
      <div className="doc-icon">
        <FileText size={16} />
      </div>
      <div>
        <b>{label}</b>
        <span>{url ? "Uploaded" : "Not uploaded yet"}</span>
      </div>
      {url && (
        <a className="row-action" href={url} target="_blank" rel="noreferrer">
          View
        </a>
      )}
    </div>
  );
}
