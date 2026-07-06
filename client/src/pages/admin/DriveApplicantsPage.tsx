import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronsRight, Trophy, Users, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
 * review pipeline for one drive. Lists applicants with the per-application
 * actions the backend exposes (approve, reject, advance round, mark selected /
 * not selected), plus the final results roster.
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
    ? companies?.find((c) => c.company_id === drive.data!.company_id)?.company_name
    : undefined;

  const title = drive.data?.job_role || companyName || "Drive applicants";
  const subtitle = companyName
    ? `${companyName} · review and progress applicants`
    : "Review and progress applicants through the rounds.";

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
                  ["Rounds", String(drive.data.number_of_rounds)],
                  ["Branches", drive.data.allowed_branches?.join(", ") || "—"],
                ]}
              />
            </CardContent>
          </Card>
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
              icon={<Users />}
              title="No applicants yet"
              description="Students who apply to this drive (or are shortlisted) will appear here."
            />
          )}

        {!applicants.isLoading &&
          !applicants.isError &&
          applicants.data &&
          applicants.data.length > 0 && (
            <ListCard
              eyebrow="Application pipeline"
              title="Applicants"
              description={`${applicants.data.length} student(s) in this drive.`}
            >
              <div className="flex flex-col gap-3">
                {applicants.data.map((a) => {
                  const rowBusy = anyPending && busyId === a.application_id;
                  const run = (fn: () => void) => {
                    setBusyId(a.application_id);
                    fn();
                  };
                  return (
                    <div
                      key={a.application_id}
                      className="flex flex-col gap-3 rounded-lg border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
                          {initialsFromName(a.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.roll_no} · {a.branch ?? "—"} · CGPA{" "}
                            {formatCgpa(a.cgpa as string)}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge tone={statusTone(a.status)}>{a.status}</StatusBadge>
                          <span className="text-xs text-muted-foreground">
                            Round {a.current_round}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={rowBusy}
                          onClick={() => run(() => approve.mutate(a.application_id))}
                        >
                          <Check /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
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
                          <ChevronsRight /> Next round
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={rowBusy}
                          onClick={() => run(() => select.mutate(a.application_id))}
                        >
                          <Trophy /> Select
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={rowBusy}
                          onClick={() => run(() => reject.mutate(a.application_id))}
                        >
                          <X /> Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          disabled={rowBusy}
                          onClick={() => run(() => notSelect.mutate(a.application_id))}
                        >
                          Not selected
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ListCard>
          )}

        {/* Final results roster - reads the dedicated results endpoint. */}
        {results.data && results.data.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Roll no</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.data.map((r) => (
                    <TableRow key={`${r.roll_no}-${r.name}`}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.roll_no}</TableCell>
                      <TableCell className="text-muted-foreground">{r.branch ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.current_round}</TableCell>
                      <TableCell>
                        <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
