import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Trophy, Users, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanies } from "../../hooks/useCompanies";
import {
  useDrive,
  useDriveStudents,
  useMarkStudentRejected,
  useMarkStudentSelected,
  useRemoveDriveStudent,
} from "../../hooks/useDrives";
import { formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";
import type { DriveStudentStatus } from "../../services/driveService";
import type { StatusTone } from "../../types";

/** Purpose: tone for a confirmed student's workflow status. */
function statusTone(status: DriveStudentStatus): StatusTone {
  switch (status) {
    case "selected":
      return "green";
    case "not_selected":
      return "red";
    default:
      return "blue"; // shortlisted
  }
}

/** Purpose: human label for a `drive_students.status` value. */
function statusLabel(status: DriveStudentStatus): string {
  switch (status) {
    case "selected":
      return "Selected";
    case "not_selected":
      return "Not selected";
    default:
      return "Shortlisted";
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
 * Purpose: /Admin/drives/:driveId - manage the confirmed shortlist for one drive
 * (the `drive_students` table). Reads GET /drive/:driveId/students and exposes the
 * per-student actions the backend supports: mark selected, mark not selected, and
 * remove from the shortlist. To (re)generate the eligible list, an admin edits the
 * drive from the Drives page, which re-opens the review-and-confirm step.
 */
export default function DriveStudentsPage() {
  const { driveId } = useParams<{ driveId: string }>();

  const drive = useDrive(driveId);
  const { data: companies } = useCompanies();
  const students = useDriveStudents(driveId);

  /** driveId is guaranteed by the route, but keep the hooks happy with a fallback. */
  const id = driveId ?? "";
  const select = useMarkStudentSelected(id);
  const reject = useMarkStudentRejected(id);
  const remove = useRemoveDriveStudent(id);

  /** Track which row triggered a mutation so only that row's buttons disable. */
  const [busyId, setBusyId] = useState<number | null>(null);

  const anyPending = select.isPending || reject.isPending || remove.isPending;

  const backTo = paths.adminDrives;
  const companyName = drive.data
    ? companies?.find((c) => c.company_id === drive.data!.company_id)?.company_name
    : undefined;

  const title = drive.data?.job_role || companyName || "Drive shortlist";
  const subtitle = companyName
    ? `${companyName} · manage the confirmed shortlist`
    : "Manage the confirmed shortlist for this drive.";

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <PageContainer>
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={backTo}>
              <ArrowLeft /> Back to drives
            </Link>
          </Button>
        </div>

        {drive.data && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
              <CardTitle className="text-lg">Drive details</CardTitle>
              <StatusBadge tone={driveStatusTone(drive.data.status)}>
                {drive.data.status}
              </StatusBadge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
              {drive.data.job_description && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {drive.data.job_description}
                </p>
              )}
              <InfoGrid
                className="lg:grid-cols-3"
                items={[
                  ["Drive ID", String(drive.data.drive_id)],
                  ["Company", companyName ?? `#${drive.data.company_id}`],
                  ["Role", drive.data.job_role ?? "—"],
                  ["Type", drive.data.employment_type],
                  ["Package (LPA)", drive.data.package_ctc ?? "—"],
                  ["Min CGPA", String(drive.data.minimum_cgpa)],
                  ["Drive date", formatDate(drive.data.drive_date)],
                  ["Deadline", formatDate(drive.data.application_deadline)],
                  ["Max active backlogs", String(drive.data.max_active_backlogs)],
                  ["Max passive backlogs", String(drive.data.max_passive_backlogs)],
                  ["Branches", drive.data.allowed_branches?.join(", ") || "—"],
                ]}
              />
            </CardContent>
          </Card>
        )}

        {students.isLoading && <LoadingState label="Loading shortlist..." />}
        {students.isError && (
          <ErrorState
            message={students.error?.message ?? "Could not load the shortlist."}
            onRetry={students.refetch}
          />
        )}

        {!students.isLoading &&
          !students.isError &&
          (!students.data || students.data.length === 0) && (
            <EmptyState
              icon={<Users />}
              title="No students confirmed yet"
              description="Edit this drive from the Drives page to generate the eligible list, then review and confirm the shortlist."
            />
          )}

        {!students.isLoading &&
          !students.isError &&
          students.data &&
          students.data.length > 0 && (
            <ListCard
              eyebrow="Confirmed shortlist"
              title="Students"
              description={`${students.data.length} student(s) confirmed for this drive.`}
            >
              <div className="flex flex-col gap-3">
                {students.data.map((s) => {
                  const rowBusy = anyPending && busyId === s.drive_student_id;
                  const run = (fn: () => void) => {
                    setBusyId(s.drive_student_id);
                    fn();
                  };
                  return (
                    <div
                      key={s.drive_student_id}
                      className="flex flex-col gap-3 rounded-lg border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
                          {initialsFromName(s.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.roll_no} · {s.branch ?? "—"} · CGPA{" "}
                            {formatCgpa(s.cgpa as string)}
                          </div>
                        </div>
                        <StatusBadge tone={statusTone(s.status)}>
                          {statusLabel(s.status)}
                        </StatusBadge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={rowBusy || s.status === "selected"}
                          onClick={() => run(() => select.mutate(s.drive_student_id))}
                        >
                          <Trophy /> Select
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={rowBusy || s.status === "not_selected"}
                          onClick={() => run(() => reject.mutate(s.drive_student_id))}
                        >
                          <X /> Not selected
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          disabled={rowBusy}
                          onClick={() => run(() => remove.mutate(s.drive_student_id))}
                        >
                          <Trash2 /> Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ListCard>
          )}
      </PageContainer>
    </>
  );
}
