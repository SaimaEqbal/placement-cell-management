import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronsRight,
  Trophy,
  Users,
  X,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui";
import { useCompanies } from "../../hooks/useCompanies";
import {
  useApproveApplication,
  useDrive,
  useDriveApplicants,
  useDriveResults,
  useMarkNotSelected,
  useMarkSelected,
  useRejectApplication,
  useUpdateApplicationRound,
} from "../../hooks/useDrives";
import { formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";
import type { StatusTone } from "../../types";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * The shared .data-row grid in data-table.css is a fixed 5 columns; this page's
 * applicants table has 6 (it adds a Round column and a wide Actions cell), so
 * it sets its own template inline to keep the header and rows aligned.
 */
const APPLICANT_COLS = "1.6fr 1fr 0.6fr 0.6fr 0.9fr 2.4fr";

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

/** Purpose: tone for a drive's lifecycle status. */
function driveStatusTone(status: string): StatusTone {
  switch (status) {
    case "ongoing":
      return "amber";
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "blue";
  }
}

/**
 * Purpose: /Admin/drives/:driveId and /TPC/drives/:driveId - the application
 * review pipeline for one drive. Lists applicants (GET /drive/:driveId/
 * applications) with the per-application actions the backend exposes under
 * /drive/applications/:applicationId/* (approve, reject, advance round, mark
 * selected / not selected), plus the final results roster (GET /drive/:driveId/
 * results). Shared by Admin and TPC (requireAdminTPC / requireAdminTPCSPC).
 */
export default function DriveApplicantsPage() {
  const { driveId } = useParams<{ driveId: string }>();

  const drive = useDrive(driveId);
  const { data: companies } = useCompanies();
  const applicants = useDriveApplicants(driveId);
  const results = useDriveResults(driveId);

  /** driveId is guaranteed by the route, but keep the hooks happy with a fallback. */
  const id = driveId ?? "";
  const approve = useApproveApplication(id);
  const reject = useRejectApplication(id);
  const advance = useUpdateApplicationRound(id);
  const select = useMarkSelected(id);
  const notSelect = useMarkNotSelected(id);

  /** Track which row triggered a mutation so only that row's buttons disable. */
  const [busyId, setBusyId] = useState<number | null>(null);

  const anyPending =
    approve.isPending ||
    reject.isPending ||
    advance.isPending ||
    select.isPending ||
    notSelect.isPending;

  const backTo = paths.adminDrives;
  const companyName = drive.data
    ? companies?.find((c) => c.company_id === drive.data!.company_id)
        ?.company_name
    : undefined;

  const title = drive.data?.job_role || companyName || "Drive applicants";
  const subtitle = companyName
    ? `${companyName} · review and progress applicants`
    : "Review and progress applicants through the rounds.";

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="dashboard-content">
        <Link
          className="text-btn"
          to={backTo}
          style={{ display: "inline-flex", marginBottom: 12 }}
        >
          <ArrowLeft size={15} /> Back to drives
        </Link>

        {drive.data && (
          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-head">
              <h2>Drive details</h2>
              <Badge tone={driveStatusTone(drive.data.status)}>
                {drive.data.status}
              </Badge>
            </div>
            <div className="panel-body">
              {drive.data.job_description && (
                <p style={{ fontSize: 12, marginBottom: 12, whiteSpace: "pre-wrap" }}>
                  {drive.data.job_description}
                </p>
              )}
              <div className="info-grid">
                <div>
                  <span>Drive ID</span>
                  <b>{drive.data.drive_id}</b>
                </div>
                <div>
                  <span>Company</span>
                  <b>{companyName ?? `#${drive.data.company_id}`}</b>
                </div>
                <div>
                  <span>Role</span>
                  <b>{drive.data.job_role ?? "-"}</b>
                </div>
                <div>
                  <span>Type</span>
                  <b>{drive.data.employment_type}</b>
                </div>
                <div>
                  <span>Package (LPA)</span>
                  <b>{drive.data.package_ctc ?? "-"}</b>
                </div>
                <div>
                  <span>Min CGPA</span>
                  <b>{drive.data.minimum_cgpa}</b>
                </div>
                <div>
                  <span>Drive date</span>
                  <b>{formatDate(drive.data.drive_date)}</b>
                </div>
                <div>
                  <span>Deadline</span>
                  <b>{formatDate(drive.data.application_deadline)}</b>
                </div>
                <div>
                  <span>Max active backlogs</span>
                  <b>{drive.data.max_active_backlogs}</b>
                </div>
                <div>
                  <span>Max passive backlogs</span>
                  <b>{drive.data.max_passive_backlogs}</b>
                </div>
                <div>
                  <span>Rounds</span>
                  <b>{drive.data.number_of_rounds}</b>
                </div>
                <div>
                  <span>Branches</span>
                  <b>{drive.data.allowed_branches?.join(", ") || "-"}</b>
                </div>
                <div>
                  <span>Created</span>
                  <b>{formatDate(drive.data.created_at)}</b>
                </div>
                <div>
                  <span>Updated</span>
                  <b>{formatDate(drive.data.updated_at)}</b>
                </div>
              </div>
            </div>
          </section>
        )}

        {applicants.isLoading && <LoadingState label="Loading applicants..." />}
        {applicants.isError && (
          <ErrorState
            message={applicants.error?.message ?? "Could not load applicants."}
            onRetry={applicants.refetch}
          />
        )}

        {!applicants.isLoading &&
          !applicants.isError &&
          (!applicants.data || applicants.data.length === 0) && (
            <EmptyState
              icon={<Users size={24} />}
              title="No applicants yet"
              description="Students who apply to this drive (or are shortlisted) will appear here."
            />
          )}

        {!applicants.isLoading &&
          !applicants.isError &&
          applicants.data &&
          applicants.data.length > 0 && (
            <section className="panel queue-panel">
              <div className="queue-head">
                <div>
                  <div className="eyebrow">Application pipeline</div>
                  <h2>Applicants</h2>
                  <p>{applicants.data.length} student(s) in this drive.</p>
                </div>
              </div>

              <div className="data-table">
                <div
                  className="data-row data-head"
                  style={{ gridTemplateColumns: APPLICANT_COLS }}
                >
                  <span>Student</span>
                  <span>Branch</span>
                  <span>CGPA</span>
                  <span>Round</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {applicants.data.map((a) => {
                  const rowBusy = anyPending && busyId === a.application_id;
                  const run = (fn: () => void) => {
                    setBusyId(a.application_id);
                    fn();
                  };
                  return (
                    <div
                      className="data-row"
                      key={a.application_id}
                      style={{ gridTemplateColumns: APPLICANT_COLS }}
                    >
                      <span className="student-cell">
                        <i>{initialsFromName(a.name)}</i>
                        <span>
                          <b>{a.name}</b>
                          <small>{a.roll_no}</small>
                        </span>
                      </span>
                      <span>{a.branch ?? "-"}</span>
                      <span>
                        <b>{formatCgpa(a.cgpa as string)}</b>
                      </span>
                      <span>{a.current_round}</span>
                      <span>
                        <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                      </span>
                      <span
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        <button
                          className="row-action"
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(() => approve.mutate(a.application_id))
                          }
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          className="row-action"
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(() =>
                              advance.mutate({
                                applicationId: a.application_id,
                                currentRound: a.current_round + 1,
                              }),
                            )
                          }
                        >
                          <ChevronsRight size={13} /> Next round
                        </button>
                        <button
                          className="row-action"
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(() => select.mutate(a.application_id))
                          }
                        >
                          <Trophy size={13} /> Select
                        </button>
                        <button
                          className="row-action"
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(() => reject.mutate(a.application_id))
                          }
                        >
                          <X size={13} /> Reject
                        </button>
                        <button
                          className="row-action"
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(() => notSelect.mutate(a.application_id))
                          }
                        >
                          Not selected
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Final results roster - reads the dedicated results endpoint. */}
        {results.data && results.data.length > 0 && (
          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-head">
              <h2>Results</h2>
            </div>
            <div className="data-table">
              <div className="data-row data-head">
                <span>Student</span>
                <span>Roll no</span>
                <span>Branch</span>
                <span>Round</span>
                <span>Status</span>
              </div>
              {results.data.map((r) => (
                <div className="data-row" key={`${r.roll_no}-${r.name}`}>
                  <span>{r.name}</span>
                  <span>{r.roll_no}</span>
                  <span>{r.branch ?? "-"}</span>
                  <span>{r.current_round}</span>
                  <span>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
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
