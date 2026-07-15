import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, ListChecks, Megaphone } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AnnouncementViewerDialog } from "@/components/dashboard/AnnouncementViewerDialog";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "../../hooks/useCompanies";
import {
  useDriveRounds,
  useDrives,
  useMyDrives,
  useMyDriveResults,
} from "../../hooks/useDrives";
import { formatDate } from "../../lib/format";
import {
  driveStudentLabel,
  driveStudentTone,
  historyResultLabel,
  historyResultTone,
  historyStageLabel,
  roundLabel,
} from "../../lib/driveStatus";
import type {
  DriveRecord,
  HistoryStage,
  MyDrive,
} from "../../services/driveService";

/** Phases within a round, in the order they happen. */
const STAGE_ORDER: HistoryStage[] = ["SHORTLIST", "PREFILTER", "ATTENDANCE", "RESULT"];

type DriveView = "all" | "mine";

/** The drive whose round-by-round results are open in the dialog. */
interface ResultsTarget {
  driveId: number;
  label: string;
}

/**
 * Purpose: /Student/drives - a student's window into placement drives. A dropdown
 * switches between "All drives" (everything the cell has announced) and "My drives"
 * (the drives this student was shortlisted into). From My drives a student opens a
 * table of their own round-by-round results. Every view reuses the shared DataTable;
 * students never see other students' data (My drives / results are server self-scoped).
 */
export default function PlacementDrivesPage() {
  const [view, setView] = useState<DriveView>("all");
  const [results, setResults] = useState<ResultsTarget | null>(null);
  /** The post_id of the drive-linked announcement open in the viewer, if any. */
  const [announcementPostId, setAnnouncementPostId] = useState<number | null>(null);

  /** Shared "Announcement" cell: a View action when linked, else a dash. */
  const announcementCell = (announcementId: number | null | undefined) =>
    announcementId ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAnnouncementPostId(announcementId)}
      >
        <Megaphone /> View announcement
      </Button>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  const { data: companies } = useCompanies();

  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  const companyOf = (companyId: number) =>
    companyNameById.get(companyId) ?? `Company #${companyId}`;

  // ---- All drives ---------------------------------------------------------
  const allDrives = useDrives();

  const allColumns: ColumnDef<DriveRecord>[] = [
    {
      id: "company",
      accessorFn: (d) => companyOf(d.company_id),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      meta: { label: "Company" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{companyOf(row.original.company_id)}</div>
          {row.original.job_role && (
            <div className="truncate text-xs text-muted-foreground">{row.original.job_role}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "employment_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
    },
    {
      id: "package",
      accessorFn: (d) => d.package_ctc ?? "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Package (LPA)" />,
      meta: { label: "Package (LPA)" },
    },
    {
      id: "min_cgpa",
      accessorFn: (d) => String(d.minimum_cgpa),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Min CGPA" />,
      meta: { label: "Min CGPA" },
    },
    {
      id: "branches",
      accessorFn: (d) => d.allowed_branches?.join(", ") || "—",
      header: "Branches",
      meta: { label: "Branches" },
      enableSorting: false,
    },
    {
      id: "announcement",
      header: "Announcement",
      meta: { label: "Announcement" },
      enableSorting: false,
      cell: ({ row }) => announcementCell(row.original.announcement_id),
    },
  ];

  // ---- My drives ----------------------------------------------------------
  const myDrives = useMyDrives();

  const driveLabel = (d: MyDrive) =>
    d.job_role || companyOf(d.company_id) || `Drive #${d.drive_id}`;

  const myColumns: ColumnDef<MyDrive>[] = [
    {
      id: "company",
      accessorFn: (d) => companyOf(d.company_id),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      meta: { label: "Company" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{companyOf(row.original.company_id)}</div>
          {row.original.job_role && (
            <div className="truncate text-xs text-muted-foreground">{row.original.job_role}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "employment_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
    },
    {
      id: "my_status",
      accessorFn: (d) => driveStudentLabel(d.my_status),
      header: ({ column }) => <DataTableColumnHeader column={column} title="My status" />,
      meta: { label: "My status" },
      cell: ({ row }) => (
        <StatusBadge tone={driveStudentTone(row.original.my_status)}>
          {driveStudentLabel(row.original.my_status)}
        </StatusBadge>
      ),
    },
    {
      id: "my_round",
      accessorFn: (d) => roundLabel(d.my_current_round),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Current round" />,
      meta: { label: "Current round" },
    },
    {
      id: "announcement",
      header: "Announcement",
      meta: { label: "Announcement" },
      enableSorting: false,
      cell: ({ row }) => announcementCell(row.original.announcement_id),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Rounds</div>,
      enableSorting: false,
      enableHiding: false,
      meta: { align: "right" },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setResults({ driveId: row.original.drive_id, label: driveLabel(row.original) })
            }
          >
            <ListChecks /> View rounds
          </Button>
        </div>
      ),
    },
  ];

  const active = view === "all" ? allDrives : myDrives;

  return (
    <>
      <Topbar
        title="Placement drives"
        subtitle="Drives announced by the placement cell. Track your progress in the ones you're shortlisted into."
      />
      <PageContainer>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {view === "all" ? "All drives" : "My drives"}
          </h2>
          <Select value={view} onValueChange={(v) => setView(v as DriveView)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All drives</SelectItem>
              <SelectItem value="mine">My drives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {active.isLoading && <LoadingState label="Loading drives..." />}
        {active.isError && (
          <ErrorState
            message={active.error?.message ?? "Could not load drives."}
            onRetry={active.refetch}
          />
        )}

        {view === "all" && !allDrives.isLoading && !allDrives.isError && (
          (allDrives.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title="No placement drives yet"
              description="The placement cell hasn't announced any drives yet. Check back soon."
            />
          ) : (
            <DataTable
              columns={allColumns}
              data={allDrives.data ?? []}
              searchPlaceholder="Search company or role..."
              enableExport
              exportFileName="drives"
            />
          )
        )}

        {view === "mine" && !myDrives.isLoading && !myDrives.isError && (
          (myDrives.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title="You're not shortlisted into any drives yet"
              description="Once the placement cell shortlists you into a drive, it will appear here with your round-by-round progress."
            />
          ) : (
            <DataTable
              columns={myColumns}
              data={myDrives.data ?? []}
              searchPlaceholder="Search your drives..."
            />
          )
        )}
      </PageContainer>

      <MyDriveResultsDialog
        target={results}
        onOpenChange={(open) => {
          if (!open) setResults(null);
        }}
      />

      <AnnouncementViewerDialog
        postId={announcementPostId}
        open={announcementPostId !== null}
        onOpenChange={(open) => {
          if (!open) setAnnouncementPostId(null);
        }}
      />
    </>
  );
}

/**
 * Purpose: the student's own progression for one drive, organised by Round and
 * then by phase (Shortlist / Pre-filter / Attendance / Results) so each phase is
 * viewed on its own - the student sees exactly one entry per phase, never stacked.
 */
function MyDriveResultsDialog({
  target,
  onOpenChange,
}: {
  target: ResultsTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const results = useMyDriveResults(target?.driveId);
  const rounds = useDriveRounds(target?.driveId);

  const [round, setRound] = useState<number | null>(null);
  const [stage, setStage] = useState<HistoryStage | null>(null);

  // Reset the selectors whenever a different drive's dialog opens.
  useEffect(() => {
    setRound(null);
    setStage(null);
  }, [target?.driveId]);

  const data = results.data ?? [];
  const roundNos = useMemo(
    () => Array.from(new Set(data.map((r) => r.round_no))).sort((a, b) => a - b),
    [data],
  );
  const activeRound = round ?? (roundNos.length ? roundNos[roundNos.length - 1] : null);

  const roundRows = data.filter((r) => r.round_no === activeRound);
  const stages = STAGE_ORDER.filter((s) => roundRows.some((r) => r.stage === s));
  const activeStage =
    stage && stages.includes(stage) ? stage : stages.length ? stages[stages.length - 1] : null;
  const phaseRows = roundRows.filter((r) => r.stage === activeStage);

  const roundDate = rounds.data?.find((r) => r.round_no === activeRound)?.round_date;

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>My rounds</DialogTitle>
          <DialogDescription>
            {target ? `${target.label} · your progress, round by round.` : ""}
          </DialogDescription>
        </DialogHeader>

        {results.isLoading && <LoadingState label="Loading your results..." />}
        {results.isError && (
          <ErrorState
            message={results.error?.message ?? "Could not load your results."}
            onRetry={results.refetch}
          />
        )}

        {!results.isLoading && !results.isError && roundNos.length === 0 && (
          <EmptyState
            icon={<ListChecks />}
            title="No round activity yet"
            description="Your progress will appear here as the drive moves through its rounds."
          />
        )}

        {!results.isLoading && !results.isError && activeRound !== null && (
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Round selector */}
            <div className="flex flex-wrap gap-2">
              {roundNos.map((rn) => (
                <Button
                  key={rn}
                  size="sm"
                  variant={rn === activeRound ? "default" : "outline"}
                  onClick={() => {
                    setRound(rn);
                    setStage(null);
                  }}
                >
                  {rn === 0 ? "Round 0" : `Round ${rn}`}
                </Button>
              ))}
            </div>

            {/* Round date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {roundDate ? `Scheduled for ${formatDate(roundDate)}` : "Date to be decided"}
            </div>

            {/* Phase selector */}
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

            {/* Selected phase - one entry per phase */}
            <div className="flex flex-col gap-3">
              {phaseRows.map((row) => (
                <div
                  key={row.history_id}
                  className="flex flex-col gap-2 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {activeStage ? historyStageLabel(activeStage) : ""}
                    </span>
                    <StatusBadge tone={historyResultTone(row.result)}>
                      {historyResultLabel(row.result)}
                    </StatusBadge>
                  </div>
                  {row.reason && (
                    <p className="text-sm text-muted-foreground">Reason: {row.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(row.recorded_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
