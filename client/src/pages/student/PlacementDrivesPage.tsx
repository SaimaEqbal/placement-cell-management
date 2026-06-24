import { useMemo } from "react";
import { Briefcase, CalendarClock, GraduationCap, IndianRupee } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrives } from "../../hooks/useDrives";
import {
  useApplyForDrive,
  useStudentApplications,
  useWithdrawApplication,
} from "../../hooks/useApplications";
import { useProfile } from "../../hooks/useProfile";
import { formatDate } from "../../lib/format";
import type { ApplicationRecord } from "../../services/applicationService";
import type { StatusTone } from "../../types";

import "../../styles/dashboard.css";

/** Purpose: tone for an application's workflow status. */
function statusTone(status: string): StatusTone {
  switch (status) {
    case "selected":
    case "approved":
      return "green";
    case "rejected":
    case "not_selected":
      return "red";
    case "pending":
      return "amber";
    default:
      return "blue";
  }
}

/**
 * Purpose: /Student/drives - lists real placement drives (GET /drive) and lets
 * the signed-in student apply (POST /application/apply/:driveId) or withdraw
 * (DELETE /application/:applicationId). Company names are resolved from the
 * cached GET /companies list; the student's numeric id (needed as student_id
 * when applying) comes from their profile (GET /students/me).
 */
export default function PlacementDrivesPage() {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();
  const { data: profile } = useProfile();
  const studentId = profile?.id;

  const { data: applications } = useStudentApplications(studentId);
  const applyForDrive = useApplyForDrive();
  const withdraw = useWithdrawApplication(studentId);

  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  // drive_id -> the student's existing application, so we can show status/withdraw.
  const applicationByDrive = useMemo(() => {
    const map = new Map<number, ApplicationRecord>();
    applications?.forEach((a) => map.set(a.drive_id, a));
    return map;
  }, [applications]);

  return (
    <>
      <Topbar
        title="Placement drives"
        subtitle="Drives currently open through the placement cell."
      />
      <div className="dashboard-content">
        {!profile && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
            Complete your profile to apply for drives.
          </p>
        )}

        {isLoading && <LoadingState label="Loading placement drives..." />}

        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load placement drives."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!drives || drives.length === 0) && (
          <EmptyState
            icon={<Briefcase size={28} />}
            title="No placement drives yet"
            description="The placement cell hasn't announced any drives yet. Check back soon."
          />
        )}

        {!isLoading && !isError && drives && drives.length > 0 && (
          <div className="two-column">
            {drives.map((drive) => {
              const application = applicationByDrive.get(drive.drive_id);
              const companyName =
                companyNameById.get(drive.company_id) ??
                `Company #${drive.company_id}`;
              return (
                <section className="panel" key={drive.drive_id}>
                  <div className="panel-head">
                    <h2>{drive.job_role || companyName}</h2>
                    {application ? (
                      <Badge tone={statusTone(application.status)}>
                        {application.status}
                      </Badge>
                    ) : (
                      <Badge tone="blue">{drive.status}</Badge>
                    )}
                  </div>
                  <div className="panel-body">
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 12,
                      }}
                    >
                      {drive.job_description ?? "No description provided."}
                    </p>
                    <div className="info-grid">
                      <div>
                        <span>Company</span>
                        <b>{companyName}</b>
                      </div>
                      <div>
                        <span>Type</span>
                        <b>{drive.employment_type}</b>
                      </div>
                      <div>
                        <span>
                          <IndianRupee size={11} /> Package (LPA)
                        </span>
                        <b>{drive.package_ctc ?? "-"}</b>
                      </div>
                      <div>
                        <span>
                          <GraduationCap size={11} /> Min CGPA
                        </span>
                        <b>{drive.minimum_cgpa}</b>
                      </div>
                      <div>
                        <span>
                          <CalendarClock size={11} /> Deadline
                        </span>
                        <b>{formatDate(drive.application_deadline)}</b>
                      </div>
                      <div>
                        <span>Branches</span>
                        <b>{drive.allowed_branches?.join(", ") || "-"}</b>
                      </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: 14 }}>
                      <p />
                      {application ? (
                        <button
                          className="secondary"
                          type="button"
                          disabled={withdraw.isPending}
                          onClick={() =>
                            withdraw.mutate(application.application_id)
                          }
                        >
                          {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
                        </button>
                      ) : (
                        <button
                          className="primary"
                          type="button"
                          disabled={!studentId || applyForDrive.isPending}
                          onClick={() =>
                            studentId &&
                            applyForDrive.mutate({
                              driveId: drive.drive_id,
                              studentId,
                            })
                          }
                        >
                          {applyForDrive.isPending ? "Applying..." : "Apply"}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {(applyForDrive.isError || withdraw.isError) && (
          <p style={{ fontSize: 11, color: "var(--red)", marginTop: 12 }}>
            {applyForDrive.error?.message ?? withdraw.error?.message}
          </p>
        )}
      </div>
    </>
  );
}
