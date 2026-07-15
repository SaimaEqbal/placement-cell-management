import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Download,
  Flag,
  Pencil,
  Trophy,
  Users,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ShortlistReviewDialog } from "@/components/dashboard/ShortlistReviewDialog";
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
  useDriveEligible,
  useDriveRounds,
  useDriveStudents,
  useFinalizeAttendance,
  useFinalizePrefilter,
  useMarkAttendance,
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
  RoundDecision,
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
            <RoundDatePrompt driveId={id} drive={drive.data} />

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
              "Min CGPA (throughout)",
              drive.minimum_cgpa_throughout != null ? String(drive.minimum_cgpa_throughout) : "—",
            ],
            [
              "Batches",
              drive.allowed_batches?.length ? drive.allowed_batches.join(", ") : "—",
            ],
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
    return <ShortlistingPanel driveId={driveId} drive={drive} students={students} />;
  }

  // In progress or completed: rounds 0..current_round are viewable.
  const selectedRound = viewRound ?? drive.current_round;
  const isLiveRound =
    drive.drive_state === "ROUND_IN_PROGRESS" && selectedRound === drive.current_round;

  return (
    <div className="flex flex-col gap-4">
      <RoundsSummaryBar driveId={driveId} drive={drive} students={students} />

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

/**
 * Purpose: an at-a-glance rounds summary derived from existing round + candidate
 * data: the current round, how many candidates are still in it, and that round's
 * scheduled (next) date.
 */
function RoundsSummaryBar({
  driveId,
  drive,
  students,
}: {
  driveId: string;
  drive: DriveRecord;
  students: DriveStudent[];
}) {
  const rounds = useDriveRounds(driveId);
  const completed = drive.drive_state === "COMPLETED";
  const inRound = students.filter((s) => s.status === "ACTIVE").length;
  const currentDate =
    rounds.data?.find((r) => r.round_no === drive.current_round)?.round_date ?? null;

  return (
    <Card>
      <CardContent className="pt-6">
        <InfoGrid
          className="sm:grid-cols-3"
          items={[
            ["Current round", completed ? "Completed" : roundLabel(drive.current_round)],
            ["Students in round", completed ? "—" : String(inRound)],
            ["Next round date", currentDate ? formatDate(currentDate) : "TBD"],
          ]}
        />
      </CardContent>
    </Card>
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

/**
 * Purpose: prompt the admin to set the current round's date when it's missing.
 * A round may not proceed past the attendance stage without a date, so this opens
 * automatically whenever the drive is opened during attendance and the current
 * round has no date, and keeps reappearing (on each visit) until one is set.
 * Dismissible per visit.
 */
function RoundDatePrompt({ driveId, drive }: { driveId: string; drive: DriveRecord }) {
  const rounds = useDriveRounds(driveId);
  const setDate = useSetRoundDate(driveId);

  const currentDate =
    rounds.data?.find((r) => r.round_no === drive.current_round)?.round_date ?? null;

  const needsDate =
    drive.drive_state === "ROUND_IN_PROGRESS" &&
    drive.round_stage === "ATTENDANCE" &&
    rounds.data !== undefined &&
    currentDate === null;

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  // Open automatically whenever a date becomes needed (i.e. each time the drive
  // is opened while the current round still lacks a date).
  useEffect(() => {
    if (needsDate) setOpen(true);
  }, [needsDate]);

  if (!needsDate) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set the Round {drive.current_round} date</DialogTitle>
          <DialogDescription>
            This round needs a scheduled date before you can finalise attendance.
            Students still in the round are notified when you set it.
          </DialogDescription>
        </DialogHeader>
        <DatePicker id="round-date-prompt" value={value} onChange={setValue} />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Later
          </Button>
          <Button
            disabled={!value || setDate.isPending}
            onClick={() =>
              setDate.mutate(
                { roundNo: drive.current_round, round_date: value },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {setDate.isPending ? "Saving..." : "Save & notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

/** Purpose: SHORTLISTING - show the confirmed shortlist, edit it, and start Round 0. */
function ShortlistingPanel({
  driveId,
  drive,
  students,
}: {
  driveId: string;
  drive: DriveRecord;
  students: DriveStudent[];
}) {
  const start = useStartRoundZero(driveId);

  // Edit-shortlist reuses the shared review dialog + on-demand eligible list.
  const [reviewOpen, setReviewOpen] = useState(false);
  const eligible = useDriveEligible(reviewOpen ? driveId : undefined);

  const driveLabel = drive.job_role || `Drive #${drive.drive_id}`;

  const editButton = (
    <Button variant="outline" onClick={() => setReviewOpen(true)}>
      <Pencil /> {students.length === 0 ? "Review shortlist" : "Edit shortlist"}
    </Button>
  );

  const reviewDialog = (
    <ShortlistReviewDialog
      open={reviewOpen}
      onOpenChange={setReviewOpen}
      driveId={driveId}
      driveLabel={driveLabel}
      eligibleStudents={eligible.data?.eligibleStudents ?? []}
      loading={eligible.isLoading}
      onConfirmed={() => setReviewOpen(false)}
    />
  );

  if (students.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Users />}
          title="No students confirmed yet"
          description="Review the eligible list and confirm a shortlist to begin. You can also edit the drive's constraints from the Drives page."
        />
        <div className="flex justify-center">{editButton}</div>
        {reviewDialog}
      </>
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
      <div className="mb-4 flex flex-wrap gap-2">
        {editButton}
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
      {reviewDialog}
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

  const attendance = useMarkAttendance(driveId);
  const finalizePre = useFinalizePrefilter(driveId);
  const finalizeAtt = useFinalizeAttendance(driveId);
  const advance = useAdvanceRound(driveId);
  const complete = useCompleteDrive(driveId);

  // Which stage this round is in (round 0 = screening = a results stage).
  const rowMode: "screening" | "prefilter" | "attendance" | "result" =
    round === 0 ? "screening" : stage === "PREFILTER" ? "prefilter" : stage === "ATTENDANCE" ? "attendance" : "result";

  // Screening and results fork: run another round OR place the cleared + complete.
  const isResultStage = rowMode === "screening" || rowMode === "result";
  // Prefilter and results use default-checked "remove/reject" checkboxes.
  const isCheckboxStage = isResultStage || rowMode === "prefilter";

  // Only candidates still in the running are shown in the live workflow; anyone
  // removed/rejected in a previous round is no longer ACTIVE and stays hidden.
  const activeStudents = students.filter((s) => s.status === "ACTIVE");

  // Checkbox decisions are held locally until the stage is finalized, so they are
  // reversible until then. Map: driveStudentId -> reason. Present in the map =
  // unchecked (being removed/rejected).
  const [unchecked, setUnchecked] = useState<Map<number, string>>(new Map());

  // Reset the local decisions whenever the round or stage changes (i.e. finalize).
  useEffect(() => {
    setUnchecked(new Map());
  }, [round, stage]);

  // The reason popup shown when a checked candidate is unchecked.
  const [reasonTarget, setReasonTarget] = useState<{
    driveStudentId: number;
    name: string;
    kind: "reject" | "remove";
  } | null>(null);

  const clearedCount = activeStudents.length - unchecked.size;
  const uncheckKind: "reject" | "remove" = rowMode === "prefilter" ? "remove" : "reject";

  const decisions: RoundDecision[] = useMemo(
    () => Array.from(unchecked, ([driveStudentId, reason]) => ({ driveStudentId, reason })),
    [unchecked],
  );

  function handleToggle(student: DriveStudent, checked: boolean) {
    if (checked) {
      // Re-checking undoes the pending removal/rejection.
      setUnchecked((prev) => {
        const next = new Map(prev);
        next.delete(student.drive_student_id);
        return next;
      });
    } else {
      // Unchecking requires a reason before it takes effect.
      setReasonTarget({ driveStudentId: student.drive_student_id, name: student.name, kind: uncheckKind });
    }
  }

  const anyBusy =
    attendance.isPending || finalizePre.isPending || finalizeAtt.isPending || advance.isPending || complete.isPending;

  const actionError =
    attendance.error ?? finalizePre.error ?? finalizeAtt.error ?? advance.error ?? complete.error;

  const heading =
    round === 0
      ? "Round 0 · Resume screening"
      : `${roundLabel(round)} · ${rowMode === "prefilter" ? "Pre-filter" : rowMode === "attendance" ? "Attendance" : "Results"}`;

  const description =
    rowMode === "screening"
      ? "Every shortlisted student is kept by default. Untick anyone the company screened out (a reason is required), then run the next round or complete the drive."
      : rowMode === "prefilter"
        ? "Everyone is kept by default. Untick anyone who should not sit this round (a reason is required), then finalise."
        : rowMode === "attendance"
          ? "Everyone is present by default — untick the students who were absent, then finalise."
          : "Every candidate clears by default. Untick anyone rejected this round (a reason is required), then run the next round or complete the drive.";

  const driveLabelText = drive.job_role || `Drive #${drive.drive_id}`;

  return (
    <ListCard eyebrow="Current round" title={heading} description={description}>
      {actionError && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{actionError.message}</AlertDescription>
        </Alert>
      )}

      {rowMode === "attendance" && activeStudents.length > 0 && (
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAttendanceSheet(activeStudents, driveLabelText, round)}
          >
            <Download /> Export attendance sheet
          </Button>
        </div>
      )}

      {activeStudents.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No active candidates"
          description="No candidates remain active in this round."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {activeStudents.map((s) => {
            const isChecked = !unchecked.has(s.drive_student_id);
            const reason = unchecked.get(s.drive_student_id);
            return (
              <StudentRow key={s.drive_student_id} student={s}>
                {isCheckboxStage && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={isChecked}
                      disabled={anyBusy}
                      onCheckedChange={(checked) => handleToggle(s, checked === true)}
                    />
                    <span className={isChecked ? "" : "font-medium text-destructive"}>
                      {isChecked
                        ? rowMode === "prefilter"
                          ? "Keeping"
                          : "Clearing"
                        : rowMode === "prefilter"
                          ? "Removing"
                          : "Rejecting"}
                    </span>
                    {!isChecked && reason && (
                      <span className="truncate text-xs text-muted-foreground">· {reason}</span>
                    )}
                  </label>
                )}
                {rowMode === "attendance" && (
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
              </StudentRow>
            );
          })}
        </div>
      )}

      {rowMode === "prefilter" && (
        <div className="mt-5 flex justify-end border-t pt-4">
          <ConfirmDialog
            trigger={
              <Button disabled={finalizePre.isPending}>
                <ArrowRight />
                {finalizePre.isPending ? "Working..." : "Finalise pre-filter → Attendance"}
              </Button>
            }
            title="Finalise pre-filter?"
            description={`${unchecked.size} student(s) will be removed from this round; the rest proceed to attendance. This can't be undone after finalising.`}
            confirmLabel="Finalise pre-filter"
            onConfirm={() => finalizePre.mutate(decisions)}
          />
        </div>
      )}

      {rowMode === "attendance" && (
        <div className="mt-5 flex justify-end border-t pt-4">
          <ConfirmDialog
            trigger={
              <Button disabled={finalizeAtt.isPending}>
                <ArrowRight />
                {finalizeAtt.isPending ? "Working..." : "Finalise attendance → Results"}
              </Button>
            }
            title="Finalise attendance?"
            description="Everyone stays present unless you unticked them. Absentees drop out of the round; only present students continue to results."
            confirmLabel="Finalise attendance"
            onConfirm={() => finalizeAtt.mutate()}
          />
        </div>
      )}

      {isResultStage && (
        <div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={advance.isPending || clearedCount === 0}>
                <ArrowRight />
                {advance.isPending ? "Working..." : `Run Round ${round + 1}`}
              </Button>
            }
            title={`Run Round ${round + 1}?`}
            description={`${clearedCount} checked student(s) clear this round and move on; ${unchecked.size} unticked student(s) are rejected. You can run as many rounds as you need.`}
            confirmLabel={`Run Round ${round + 1}`}
            onConfirm={() => advance.mutate(decisions)}
          />
          <ConfirmDialog
            trigger={
              <Button disabled={complete.isPending}>
                <Trophy />
                {complete.isPending ? "Working..." : "Place cleared & complete"}
              </Button>
            }
            title="Complete this drive?"
            description={`${clearedCount} checked student(s) will be placed and ${unchecked.size} unticked student(s) rejected. This cannot be undone.`}
            confirmLabel="Complete drive"
            onConfirm={() => complete.mutate(decisions)}
          />
        </div>
      )}

      <ReasonDialog
        open={reasonTarget !== null}
        name={reasonTarget?.name}
        kind={reasonTarget?.kind}
        pending={false}
        onOpenChange={(open) => {
          if (!open) setReasonTarget(null);
        }}
        onConfirm={(reason) => {
          if (!reasonTarget) return;
          setUnchecked((prev) => new Map(prev).set(reasonTarget.driveStudentId, reason));
          setReasonTarget(null);
        }}
      />
    </ListCard>
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

  // Summary derived from the round's history: how many were present, and how many
  // cleared. Round 0 has no attendance, so "present" is the number screened.
  const presentCount =
    round === 0
      ? new Set(rows.filter((r) => r.stage === "SHORTLIST").map((r) => r.student_id)).size
      : new Set(
          rows
            .filter((r) => r.stage === "ATTENDANCE" && r.result === "PRESENT")
            .map((r) => r.student_id),
        ).size;
  const clearedCount = new Set(
    rows
      .filter((r) => r.stage === "RESULT" && (r.result === "SELECTED" || r.result === "PLACED"))
      .map((r) => r.student_id),
  ).size;

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
          <InfoGrid
            className="sm:grid-cols-2"
            items={[
              ["Present", String(presentCount)],
              ["Cleared", String(clearedCount)],
            ]}
          />

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
