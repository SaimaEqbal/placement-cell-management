import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Download,
  Flag,
  Pencil,
  Trophy,
  UserMinus,
  Users,
  X,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCompanies } from "../../hooks/useCompanies";
import {
  useAdvanceRound,
  useCompleteDrive,
  useDrive,
  useDriveRounds,
  useDriveStudents,
  useFinalizeAttendance,
  useFinalizePrefilter,
  useMarkAttendance,
  usePrefilterRemove,
  useRecordResult,
  useRoundHistory,
  useSetRoundDate,
  useStartRoundZero,
} from "../../hooks/useDrives";
import { formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import {
  driveStateLabel,
  driveStateTone,
  driveStudentLabel,
  driveStudentTone,
  historyResultLabel,
  historyResultTone,
  historyStageLabel,
  roundLabel,
} from "../../lib/driveStatus";
import { exportAttendanceSheet } from "../../lib/attendanceExport";
import { paths } from "../../routes/paths";
import type {
  DriveRecord,
  DriveStudent,
  HistoryStage,
  RoundHistoryRow,
} from "../../services/driveService";

/** Phases within a round, in the order they happen. */
const STAGE_ORDER: HistoryStage[] = ["SHORTLIST", "PREFILTER", "ATTENDANCE", "RESULT"];

/**
 * Purpose: /Admin/drives/:driveId - operate a drive's round-based workflow. During
 * SHORTLISTING it shows the confirmed shortlist and a "Start Round 0" action; once
 * in progress it drives each round through its stages (Round 0 screening; rounds
 * 1..N: pre-filter -> attendance -> results) and lets the admin switch to any past
 * round to view its permanent history. Student-facing views are unaffected.
 */
export default function DriveStudentsPage() {
  const { driveId } = useParams<{ driveId: string }>();
  const id = driveId ?? "";

  const drive = useDrive(driveId);
  const { data: companies } = useCompanies();
  const students = useDriveStudents(driveId);

  const [viewRound, setViewRound] = useState<number | null>(null);

  const companyName = drive.data
    ? companies?.find((c) => c.company_id === drive.data!.company_id)?.company_name
    : undefined;

  const title = drive.data?.job_role || companyName || "Drive";
  const subtitle = companyName
    ? `${companyName} · recruitment workflow`
    : "Run this drive's recruitment workflow.";

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <PageContainer>
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={paths.adminDrives}>
              <ArrowLeft /> Back to drives
            </Link>
          </Button>
        </div>

        {drive.isLoading && <LoadingState label="Loading drive..." />}
        {drive.isError && (
          <ErrorState
            message={drive.error?.message ?? "Could not load the drive."}
            onRetry={drive.refetch}
          />
        )}

        {drive.data && (
          <>
            <DriveDetailsCard drive={drive.data} companyName={companyName} />

            {students.isLoading && <LoadingState label="Loading students..." />}
            {students.isError && (
              <ErrorState
                message={students.error?.message ?? "Could not load students."}
                onRetry={students.refetch}
              />
            )}

            {!students.isLoading && !students.isError && (
              <WorkflowSection
                driveId={id}
                drive={drive.data}
                students={students.data ?? []}
                viewRound={viewRound}
                onViewRound={setViewRound}
              />
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}

/** Purpose: the drive summary card with its workflow-state and round/stage badges. */
function DriveDetailsCard({
  drive,
  companyName,
}: {
  drive: DriveRecord;
  companyName?: string;
}) {
  const stageBadge =
    drive.drive_state === "ROUND_IN_PROGRESS"
      ? `${roundLabel(drive.current_round)}${drive.round_stage ? ` · ${historyStageLabel(drive.round_stage)}` : ""}`
      : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="text-lg">Drive details</CardTitle>
        <div className="flex items-center gap-2">
          {stageBadge && <StatusBadge tone="gray">{stageBadge}</StatusBadge>}
          <StatusBadge tone={driveStateTone(drive.drive_state)}>
            {driveStateLabel(drive.drive_state)}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-6">
        {drive.job_description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {drive.job_description}
          </p>
        )}
        <InfoGrid
          className="lg:grid-cols-3"
          items={[
            ["Company", companyName ?? `#${drive.company_id}`],
            ["Role", drive.job_role ?? "—"],
            ["Type", drive.employment_type],
            ["Package (LPA)", drive.package_ctc ?? "—"],
            ["Min CGPA", String(drive.minimum_cgpa)],
            [
              "Rounds held",
              drive.drive_state === "COMPLETED" ? String(drive.number_of_rounds ?? 0) : "—",
            ],
            ["Branches", drive.allowed_branches?.join(", ") || "—"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

/** Purpose: choose between the shortlisting screen, the live round panel, and the history view. */
function WorkflowSection({
  driveId,
  drive,
  students,
  viewRound,
  onViewRound,
}: {
  driveId: string;
  drive: DriveRecord;
  students: DriveStudent[];
  viewRound: number | null;
  onViewRound: (round: number | null) => void;
}) {
  if (drive.drive_state === "SHORTLISTING") {
    return <ShortlistingPanel driveId={driveId} students={students} />;
  }

  // In progress or completed: rounds 0..current_round are viewable.
  const selectedRound = viewRound ?? drive.current_round;
  const isLiveRound =
    drive.drive_state === "ROUND_IN_PROGRESS" && selectedRound === drive.current_round;

  return (
    <div className="flex flex-col gap-4">
      <RoundTabs
        current={drive.current_round}
        selected={selectedRound}
        onSelect={onViewRound}
      />

      <RoundDateBar driveId={driveId} roundNo={selectedRound} />

      {isLiveRound ? (
        <LiveRoundPanel driveId={driveId} drive={drive} students={students} />
      ) : (
        <RoundHistoryTable driveId={driveId} round={selectedRound} />
      )}
    </div>
  );
}

/** Purpose: show and (for admins) edit a round's date; saving notifies the round's students. */
function RoundDateBar({ driveId, roundNo }: { driveId: string; roundNo: number }) {
  const rounds = useDriveRounds(driveId);
  const setDate = useSetRoundDate(driveId);

  const current = rounds.data?.find((r) => r.round_no === roundNo)?.round_date ?? null;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  // Reset the editor whenever the selected round or its stored date changes.
  useEffect(() => {
    setValue(current ? current.slice(0, 10) : "");
    setEditing(false);
  }, [current, roundNo]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        <CalendarClock className="size-4 text-muted-foreground" />
        <span className="font-medium">Round {roundNo} date:</span>
        <span className="text-muted-foreground">
          {current ? formatDate(current) : "TBD"}
        </span>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker id={`round-${roundNo}-date`} value={value} onChange={setValue} allowTbd />
          <Button
            size="sm"
            disabled={setDate.isPending}
            onClick={() =>
              setDate.mutate(
                { roundNo, round_date: value || "TBD" },
                { onSuccess: () => setEditing(false) },
              )
            }
          >
            {setDate.isPending ? "Saving..." : "Save & notify"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> {current ? "Change date" : "Set date"}
        </Button>
      )}
    </div>
  );
}

/** Purpose: a button-group of round tabs (Round 0 .. current). */
function RoundTabs({
  current,
  selected,
  onSelect,
}: {
  current: number;
  selected: number;
  onSelect: (round: number) => void;
}) {
  const rounds = Array.from({ length: current + 1 }, (_, i) => i);
  return (
    <div className="flex flex-wrap gap-2">
      {rounds.map((r) => (
        <Button
          key={r}
          type="button"
          size="sm"
          variant={r === selected ? "default" : "outline"}
          onClick={() => onSelect(r)}
        >
          {r === 0 ? "Round 0 · Screening" : `Round ${r}`}
        </Button>
      ))}
    </div>
  );
}

/** Purpose: SHORTLISTING - show the confirmed shortlist and the Start Round 0 action. */
function ShortlistingPanel({
  driveId,
  students,
}: {
  driveId: string;
  students: DriveStudent[];
}) {
  const start = useStartRoundZero(driveId);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No students confirmed yet"
        description="Edit this drive from the Drives page to generate the eligible list, then review and confirm the shortlist."
      />
    );
  }

  return (
    <ListCard
      eyebrow="Shortlist"
      title="Confirmed students"
      description={`${students.length} student(s) shortlisted. Starting Round 0 sends this list to the company and locks the drive.`}
    >
      {start.isError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>
            {start.error?.message ?? "Could not start Round 0."}
          </AlertDescription>
        </Alert>
      )}
      <div className="mb-4">
        <ConfirmDialog
          trigger={
            <Button disabled={start.isPending}>
              <Flag /> {start.isPending ? "Starting..." : "Start Round 0"}
            </Button>
          }
          title="Start Round 0?"
          description="This finalises the shortlist, sends it to the company for resume screening, and locks the drive. Eligibility criteria can no longer be changed."
          confirmLabel="Start Round 0"
          onConfirm={() => start.mutate()}
        />
      </div>
      <div className="flex flex-col gap-3">
        {students.map((s) => (
          <StudentRow key={s.drive_student_id} student={s} />
        ))}
      </div>
    </ListCard>
  );
}

/** Purpose: the live stage panel for the current round (screening / pre-filter / attendance / results). */
function LiveRoundPanel({
  driveId,
  drive,
  students,
}: {
  driveId: string;
  drive: DriveRecord;
  students: DriveStudent[];
}) {
  const round = drive.current_round;
  const stage = drive.round_stage;

  const prefilter = usePrefilterRemove(driveId);
  const attendance = useMarkAttendance(driveId);
  const result = useRecordResult(driveId);
  const finalizePre = useFinalizePrefilter(driveId);
  const finalizeAtt = useFinalizeAttendance(driveId);
  const advance = useAdvanceRound(driveId);
  const complete = useCompleteDrive(driveId);

  /** { driveStudentId, name, kind } for the reason dialog (reject / remove). */
  const [reasonTarget, setReasonTarget] = useState<{
    driveStudentId: number;
    name: string;
    kind: "reject" | "remove";
  } | null>(null);

  const active = students.filter((s) => s.status === "ACTIVE");
  const selectedCount = students.filter((s) => s.status === "SELECTED").length;
  const allResolved = active.length === 0;

  // Which per-student actions each active row shows in this stage.
  const rowMode: "screening" | "prefilter" | "attendance" | "result" =
    round === 0 ? "screening" : stage === "PREFILTER" ? "prefilter" : stage === "ATTENDANCE" ? "attendance" : "result";

  // The results stage (screening or a later round's results) is the only stage
  // that forks: run another round OR place the selected and complete the drive.
  const isResultStage = rowMode === "screening" || rowMode === "result";

  const anyBusy =
    prefilter.isPending || attendance.isPending || result.isPending;

  const actionError =
    prefilter.error ?? attendance.error ?? result.error ??
    finalizePre.error ?? finalizeAtt.error ?? advance.error ?? complete.error;

  // The single forward transition for the non-results stages (pre-filter/attendance).
  let footer: { label: string; pending: boolean; disabled: boolean; onConfirm: () => void; title: string; description: string } | null = null;

  if (rowMode === "prefilter") {
    footer = {
      label: "Finalise pre-filter → Attendance",
      pending: finalizePre.isPending,
      disabled: finalizePre.isPending,
      onConfirm: () => finalizePre.mutate(),
      title: "Finalise pre-filter?",
      description: "No more students can be removed for this round after this. Attendance opens next.",
    };
  } else if (rowMode === "attendance") {
    footer = {
      label: "Finalise attendance → Results",
      pending: finalizeAtt.isPending,
      disabled: finalizeAtt.isPending,
      onConfirm: () => finalizeAtt.mutate(),
      title: "Finalise attendance?",
      description: "Everyone stays present unless you unticked them. Absentees are recorded and drop out of the round; only present students continue to results.",
    };
  }

  const heading =
    round === 0
      ? "Round 0 · Resume screening"
      : `${roundLabel(round)} · ${rowMode === "prefilter" ? "Pre-filter" : rowMode === "attendance" ? "Attendance" : "Results"}`;

  const description =
    rowMode === "screening"
      ? "Mark each shortlisted student selected or rejected based on the company's screening."
      : rowMode === "prefilter"
        ? "Remove any students who should not sit this round (a reason is required)."
        : rowMode === "attendance"
          ? "Everyone is present by default — untick the students who were absent, then finalise."
          : "Record each present student's result.";

  const driveLabelText = drive.job_role || `Drive #${drive.drive_id}`;

  return (
    <ListCard eyebrow="Current round" title={heading} description={description}>
      {actionError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{actionError.message}</AlertDescription>
        </Alert>
      )}

      {(rowMode === "prefilter" || rowMode === "attendance") && active.length > 0 && (
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAttendanceSheet(active, driveLabelText, round)}
          >
            <Download /> Export attendance sheet
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {students.map((s) => {
          const isActive = s.status === "ACTIVE";
          return (
            <StudentRow key={s.drive_student_id} student={s}>
              {isActive && rowMode === "screening" && (
                <ResultActions
                  busy={anyBusy}
                  onSelect={() =>
                    result.mutate({ driveStudentId: s.drive_student_id, result: "SELECTED" })
                  }
                  onReject={() =>
                    setReasonTarget({ driveStudentId: s.drive_student_id, name: s.name, kind: "reject" })
                  }
                />
              )}
              {isActive && rowMode === "prefilter" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={anyBusy}
                  onClick={() =>
                    setReasonTarget({ driveStudentId: s.drive_student_id, name: s.name, kind: "remove" })
                  }
                >
                  <UserMinus /> Remove
                </Button>
              )}
              {isActive && rowMode === "attendance" && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={s.attendance_mark !== "ABSENT"}
                    disabled={anyBusy}
                    onCheckedChange={(checked) =>
                      attendance.mutate({
                        driveStudentId: s.drive_student_id,
                        present: checked === true,
                      })
                    }
                  />
                  {s.attendance_mark === "ABSENT" ? "Absent" : "Present"}
                </label>
              )}
              {isActive && rowMode === "result" && (
                <ResultActions
                  busy={anyBusy}
                  onSelect={() =>
                    result.mutate({ driveStudentId: s.drive_student_id, result: "SELECTED" })
                  }
                  onReject={() =>
                    setReasonTarget({ driveStudentId: s.drive_student_id, name: s.name, kind: "reject" })
                  }
                />
              )}
            </StudentRow>
          );
        })}
      </div>

      {footer && (
        <div className="mt-5 flex justify-end border-t pt-4">
          <ConfirmDialog
            trigger={
              <Button disabled={footer.disabled}>
                <ArrowRight />
                {footer.pending ? "Working..." : footer.label}
              </Button>
            }
            title={footer.title}
            description={footer.description}
            confirmLabel={footer.label}
            onConfirm={footer.onConfirm}
          />
        </div>
      )}

      {isResultStage && (
        <div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={advance.isPending || !allResolved || selectedCount === 0}>
                <ArrowRight />
                {advance.isPending ? "Working..." : `Run Round ${round + 1}`}
              </Button>
            }
            title={`Run Round ${round + 1}?`}
            description="The selected students move on to a new round; everyone else is out. You can run as many rounds as you need."
            confirmLabel={`Run Round ${round + 1}`}
            onConfirm={() => advance.mutate()}
          />
          <ConfirmDialog
            trigger={
              <Button disabled={complete.isPending || !allResolved}>
                <Trophy />
                {complete.isPending ? "Working..." : "Place selected & complete"}
              </Button>
            }
            title="Complete this drive?"
            description={`${selectedCount} selected student(s) will be marked Placed and the drive will be completed. This cannot be undone.`}
            confirmLabel="Complete drive"
            onConfirm={() => complete.mutate()}
          />
        </div>
      )}

      <ReasonDialog
        open={reasonTarget !== null}
        name={reasonTarget?.name}
        kind={reasonTarget?.kind}
        pending={prefilter.isPending || result.isPending}
        onOpenChange={(open) => {
          if (!open) setReasonTarget(null);
        }}
        onConfirm={(reason) => {
          if (!reasonTarget) return;
          if (reasonTarget.kind === "remove") {
            prefilter.mutate(
              { driveStudentId: reasonTarget.driveStudentId, reason },
              { onSuccess: () => setReasonTarget(null) },
            );
          } else {
            result.mutate(
              { driveStudentId: reasonTarget.driveStudentId, result: "REJECTED", reason },
              { onSuccess: () => setReasonTarget(null) },
            );
          }
        }}
      />
    </ListCard>
  );
}

/** Purpose: the Select / Reject pair used in screening and result stages. */
function ResultActions({
  busy,
  onSelect,
  onReject,
}: {
  busy: boolean;
  onSelect: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={onSelect}>
        <Check /> Select
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={onReject}>
        <X /> Reject
      </Button>
    </div>
  );
}

/** Purpose: one roster row - avatar, name/meta, current status badge, and optional action slot. */
function StudentRow({
  student,
  children,
}: {
  student: DriveStudent;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
          {initialsFromName(student.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{student.name}</div>
          <div className="text-xs text-muted-foreground">
            {student.roll_no} · {student.branch ?? "—"} · CGPA{" "}
            {formatCgpa(student.cgpa as string)}
          </div>
          {student.remarks && (
            <div className="mt-1 text-xs text-muted-foreground">Note: {student.remarks}</div>
          )}
        </div>
        <StatusBadge tone={driveStudentTone(student.status)}>
          {driveStudentLabel(student.status)}
        </StatusBadge>
      </div>
      {children && <div className="sm:shrink-0">{children}</div>}
    </div>
  );
}

/** Purpose: capture a mandatory reason for a reject or a pre-filter removal. */
function ReasonDialog({
  open,
  name,
  kind,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  name?: string;
  kind?: "reject" | "remove";
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const verb = kind === "remove" ? "Remove" : "Reject";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {verb} {name ?? "student"}
          </DialogTitle>
          <DialogDescription>
            A reason is required and is kept in this drive's permanent history.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={kind === "remove" ? "e.g. Company request, discipline issue..." : "e.g. Resume mismatch, screening decision..."}
          rows={3}
        />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || pending}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? "Saving..." : verb}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Purpose: read-only history for one round, split into its phases (Shortlist /
 * Pre-filter / Attendance / Results). Each phase is a separate table, so a student
 * appears at most once in the phase being viewed instead of stacked across phases.
 */
function RoundHistoryTable({ driveId, round }: { driveId: string; round: number }) {
  const history = useRoundHistory(driveId, round);
  const [stage, setStage] = useState<HistoryStage | null>(null);

  const rows = history.data ?? [];
  const stages = STAGE_ORDER.filter((s) => rows.some((r) => r.stage === s));
  const activeStage = stage && stages.includes(stage) ? stage : stages[0] ?? null;
  const phaseRows = rows.filter((r) => r.stage === activeStage);

  const columns: ColumnDef<RoundHistoryRow>[] = [
    {
      id: "student",
      accessorFn: (r) => r.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      meta: { label: "Student" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.roll_no} · {row.original.branch ?? "—"}
          </div>
        </div>
      ),
    },
    {
      id: "result",
      accessorFn: (r) => historyResultLabel(r.result),
      header: "Result",
      meta: { label: "Result" },
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge tone={historyResultTone(row.original.result)}>
          {historyResultLabel(row.original.result)}
        </StatusBadge>
      ),
    },
    {
      id: "reason",
      accessorFn: (r) => r.reason ?? "—",
      header: "Reason",
      meta: { label: "Reason" },
      enableSorting: false,
    },
    {
      id: "date",
      accessorFn: (r) => formatDate(r.recorded_at),
      header: "Date",
      meta: { label: "Date" },
    },
  ];

  if (history.isLoading) return <LoadingState label="Loading round history..." />;
  if (history.isError)
    return (
      <ErrorState
        message={history.error?.message ?? "Could not load round history."}
        onRetry={history.refetch}
      />
    );

  return (
    <ListCard
      eyebrow="History"
      title={roundLabel(round)}
      description="Review each phase of this round separately."
    >
      {stages.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No history for this round"
          description="Nothing has been recorded for this round yet."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === activeStage ? "secondary" : "ghost"}
                onClick={() => setStage(s)}
              >
                {historyStageLabel(s)}
              </Button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={phaseRows}
            searchPlaceholder="Search student..."
            emptyMessage="No students in this phase."
            enableExport
            exportFileName={`drive-${driveId}-round-${round}-${activeStage ?? "history"}`}
          />
        </div>
      )}
    </ListCard>
  );
}
