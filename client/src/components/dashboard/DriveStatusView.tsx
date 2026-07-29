import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { RoundHistory } from "@/components/dashboard/RoundHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDriveRounds } from "@/hooks/useDrives";
import {
  driveStateLabel,
  driveStateTone,
  historyStageLabel,
  roundLabel,
  roundDisplayName,
} from "@/lib/driveStatus";
import { formatDate } from "@/lib/format";
import type { DriveRecord, DriveStudent } from "@/services/driveService";

/**
 * Purpose: the drive summary card with its workflow-state and round/stage badges.
 * Extracted from the admin DriveStudentsPage so the same read-only summary can be
 * embedded on the SPC/TPC drive-status pages.
 */
export function DriveDetailsCard({
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

/**
 * Purpose: an at-a-glance rounds summary derived from existing round + candidate
 * data: the current round, how many candidates are still in it, and that round's
 * scheduled (next) date. Extracted from the admin DriveStudentsPage for reuse.
 */
export function RoundsSummaryBar({
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
  const currentRound = rounds.data?.find((r) => r.round_no === drive.current_round);
  const currentDate = currentRound?.round_date ?? null;

  return (
    <Card>
      <CardContent className="pt-6">
        <InfoGrid
          className="sm:grid-cols-3"
          items={[
            [
              "Current round",
              completed
                ? "Completed"
                : roundDisplayName(drive.current_round, currentRound?.round_name),
            ],
            ["Students in round", completed ? "—" : String(inRound)],
            ["Next round date", currentDate ? formatDate(currentDate) : "TBD"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Purpose: read-only "view status" for one drive - the drive summary, the
 * concluded-round history (reusing the shared RoundHistory viewer), and an
 * at-a-glance current-round summary once rounds are running. Contains no
 * mutating controls, so it can be embedded on the SPC/TPC pages where those
 * roles only observe a drive's progress.
 */
export function DriveStatusView({
  driveId,
  drive,
  companyName,
  students,
}: {
  driveId: string;
  drive: DriveRecord;
  companyName?: string;
  students: DriveStudent[];
}) {
  const started = drive.drive_state !== "SHORTLISTING";

  return (
    <div className="flex flex-col gap-4">
      <DriveDetailsCard drive={drive} companyName={companyName} />

      {started ? (
        <>
          <RoundHistory
            driveId={driveId}
            currentRound={drive.current_round}
            driveCompleted={drive.drive_state === "COMPLETED"}
          />
          <RoundsSummaryBar driveId={driveId} drive={drive} students={students} />
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This drive is still shortlisting eligible students. Round progress
              will appear here once the recruitment rounds begin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
