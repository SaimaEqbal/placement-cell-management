import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, History, Users } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { useDriveRounds, useRoundHistory } from "@/hooks/useDrives";
import {
  historyResultLabel,
  historyResultTone,
  historyStageLabel,
  roundDisplayName,
} from "@/lib/driveStatus";
import { formatDate } from "@/lib/format";
import type {
  DriveRound,
  HistoryStage,
  RoundHistoryRow,
} from "@/services/driveService";

/** Phases within a round, in the order they happen. */
const STAGE_ORDER: HistoryStage[] = ["SHORTLIST", "PREFILTER", "ATTENDANCE", "RESULT"];

/**
 * Purpose: read-only history for one round, split into its phases (Shortlist /
 * Pre-filter / Attendance / Results). Each phase is a separate table, so a
 * student appears at most once in the phase being viewed. Role-agnostic: it only
 * reads, so it can be embedded anywhere (admin drive page, SPC/TPC pages).
 */
function RoundHistoryDetails({ driveId, round }: { driveId: string; round: number }) {
  const history = useRoundHistory(driveId, round);
  const rounds = useDriveRounds(driveId);
  const [stage, setStage] = useState<HistoryStage | null>(null);

  const roundRow = rounds.data?.find((r) => r.round_no === round);
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

  return stages.length === 0 ? (
    <EmptyState
      icon={<Users />}
      title="No history for this round"
      description="Nothing has been recorded for this round yet."
    />
  ) : (
    <div className="flex flex-col gap-4">
      <InfoGrid
        className="sm:grid-cols-4"
        items={[
          ["Present", String(presentCount)],
          ["Cleared", String(clearedCount)],
          ["Started", roundRow?.started_at ? formatDate(roundRow.started_at) : "—"],
          ["Concluded", roundRow?.concluded_at ? formatDate(roundRow.concluded_at) : "—"],
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
  );
}

/**
 * Purpose: the reusable round-history viewer dialog. Contains the round
 * button-group (switch between all historical rounds) plus the per-round detail
 * view. Role-agnostic and read-only by design, so it can also be embedded from
 * the SPC/TPC pages later; `readOnly` is accepted for future embedding but the
 * viewer contains no mutating controls today.
 */
export function RoundHistoryViewer({
  driveId,
  rounds,
  open,
  onOpenChange,
  initialRound,
  readOnly: _readOnly = true,
}: {
  driveId: string;
  /** The viewable (concluded) round numbers, ascending. */
  rounds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The round selected when the viewer opens. */
  initialRound?: number;
  /** Reserved for future SPC/TPC embedding; the viewer is read-only regardless. */
  readOnly?: boolean;
}) {
  const roundRows = useDriveRounds(driveId);
  const [selected, setSelected] = useState<number | null>(null);

  // Select the requested round each time the viewer opens.
  useEffect(() => {
    if (open) setSelected(initialRound ?? rounds[rounds.length - 1] ?? null);
  }, [open, initialRound, rounds]);

  const nameOf = (r: number) =>
    roundDisplayName(r, roundRows.data?.find((x) => x.round_no === r)?.round_name);

  const active = selected ?? rounds[rounds.length - 1] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" /> Round history
          </DialogTitle>
          <DialogDescription>
            Review each concluded round, phase by phase.
          </DialogDescription>
        </DialogHeader>

        {rounds.length === 0 ? (
          <EmptyState
            icon={<History />}
            title="No concluded rounds"
            description="Round history appears here once a round concludes."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {rounds.map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="sm"
                  variant={r === active ? "default" : "outline"}
                  onClick={() => setSelected(r)}
                >
                  {nameOf(r)}
                </Button>
              ))}
            </div>

            {active !== null && <RoundHistoryDetails driveId={driveId} round={active} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Purpose: one collapsible row of the Round History card. The header carries the
 * round's name + lifecycle dates; expanding shows how many students entered and
 * finished the round, with a View Details action that opens the shared viewer.
 */
function RoundHistoryItem({
  driveId,
  round,
  onViewDetails,
}: {
  driveId: string;
  round: DriveRound;
  onViewDetails: (roundNo: number) => void;
}) {
  const history = useRoundHistory(driveId, round.round_no);
  const rows = history.data ?? [];

  // Entered = everyone who reached this round (any event in it; round 0 = the
  // shortlist). Finished = everyone who cleared it (SELECTED / PLACED).
  const entered =
    round.round_no === 0
      ? new Set(rows.filter((r) => r.stage === "SHORTLIST").map((r) => r.student_id)).size
      : new Set(rows.map((r) => r.student_id)).size;
  const finished = new Set(
    rows
      .filter((r) => r.stage === "RESULT" && (r.result === "SELECTED" || r.result === "PLACED"))
      .map((r) => r.student_id),
  ).size;

  return (
    <AccordionItem value={String(round.round_no)}>
      <AccordionTrigger>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="truncate font-medium">
            {roundDisplayName(round.round_no, round.round_name)}
          </span>
          <span className="flex flex-wrap gap-x-4 text-xs font-normal text-muted-foreground">
            <span>Started: {round.started_at ? formatDate(round.started_at) : "—"}</span>
            <span>Held on: {round.round_date ? formatDate(round.round_date) : "TBD"}</span>
            <span>Concluded: {round.concluded_at ? formatDate(round.concluded_at) : "—"}</span>
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-3">
          {history.isLoading ? (
            <LoadingState label="Loading round summary..." />
          ) : (
            <InfoGrid
              className="sm:grid-cols-2"
              items={[
                ["Students entered", String(entered)],
                ["Students finished", String(finished)],
              ]}
            />
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(round.round_no)}
            >
              <Eye /> View details
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * Purpose: the "Round History" card - every CONCLUDED round of a drive as a
 * collapsible accordion (latest first), each opening the shared RoundHistoryViewer
 * at that round. Role-agnostic (read-only), so it can be embedded on the admin
 * drive page today and the SPC/TPC pages later.
 */
export function RoundHistory({
  driveId,
  currentRound,
  driveCompleted,
}: {
  driveId: string;
  /** The drive's current round number. */
  currentRound: number;
  /** When true, the current round is also concluded (drive completed). */
  driveCompleted: boolean;
}) {
  const rounds = useDriveRounds(driveId);
  const [viewer, setViewer] = useState<{ open: boolean; round?: number }>({ open: false });

  // Concluded rounds only: everything before the current round, plus the current
  // round itself once the drive completes. Latest first.
  const lastConcluded = driveCompleted ? currentRound : currentRound - 1;
  const concluded = (rounds.data ?? [])
    .filter((r) => r.round_no <= lastConcluded)
    .sort((a, b) => b.round_no - a.round_no);
  const roundNosAsc = concluded.map((r) => r.round_no).sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-4 text-muted-foreground" /> Round History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {rounds.isLoading ? (
          <LoadingState label="Loading rounds..." />
        ) : concluded.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No rounds have concluded yet. Concluded rounds appear here, latest first.
          </p>
        ) : (
          <Accordion type="single" collapsible>
            {concluded.map((r) => (
              <RoundHistoryItem
                key={r.round_no}
                driveId={driveId}
                round={r}
                onViewDetails={(roundNo) => setViewer({ open: true, round: roundNo })}
              />
            ))}
          </Accordion>
        )}
      </CardContent>

      <RoundHistoryViewer
        driveId={driveId}
        rounds={roundNosAsc}
        open={viewer.open}
        onOpenChange={(open) => setViewer((v) => ({ ...v, open }))}
        initialRound={viewer.round}
      />
    </Card>
  );
}
