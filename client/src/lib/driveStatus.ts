import type { StatusTone } from "../types";
import type {
  DriveStudentStatus,
  DriveState,
  HistoryResult,
  HistoryStage,
} from "../services/driveService";

/** Purpose: badge tone for a student's current state inside a drive. */
export function driveStudentTone(status: DriveStudentStatus): StatusTone {
  switch (status) {
    case "SELECTED":
    case "PLACED":
      return "green";
    case "ACTIVE":
      return "amber";
    case "SHORTLISTED":
      return "blue";
    case "REJECTED":
    case "ABSENT":
      return "red";
    case "REMOVED":
      return "gray";
    default:
      return "gray";
  }
}

/** Purpose: human label for a `drive_students.status` value. */
export function driveStudentLabel(status: DriveStudentStatus): string {
  switch (status) {
    case "SHORTLISTED":
      return "Shortlisted";
    case "ACTIVE":
      return "In progress";
    case "SELECTED":
      return "Selected";
    case "REJECTED":
      return "Rejected";
    case "ABSENT":
      return "Absent";
    case "REMOVED":
      return "Removed";
    case "PLACED":
      return "Placed";
    default:
      return status;
  }
}

/** Purpose: human label for a drive's authoritative workflow state. */
export function driveStateLabel(state: DriveState): string {
  switch (state) {
    case "SHORTLISTING":
      return "Shortlisting";
    case "ROUND_IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    default:
      return state;
  }
}

/** Purpose: badge tone for a drive's workflow state. */
export function driveStateTone(state: DriveState): StatusTone {
  switch (state) {
    case "ROUND_IN_PROGRESS":
      return "amber";
    case "COMPLETED":
      return "green";
    default:
      return "blue"; // SHORTLISTING
  }
}

/** Purpose: human label for a round number (-1 shortlisting, 0 screening, 1..N). */
export function roundLabel(roundNo: number): string {
  if (roundNo < 0) return "Shortlisting";
  if (roundNo === 0) return "Company Screening";
  return `Round ${roundNo}`;
}

/**
 * A round's display name: the admin-provided name if present, otherwise the
 * "Round N" fallback ("Company Screening" for round 0). Used wherever a round's
 * name is shown (drives tables, round summary, prompt).
 */
export function roundDisplayName(
  roundNo: number,
  roundName?: string | null,
): string {
  if (roundName && roundName.trim()) return roundName.trim();
  if (roundNo < 0) return "Shortlisting";
  return roundNo === 0 ? "Company Screening" : `Round ${roundNo}`;
}

/** Purpose: human label for a history stage. */
export function historyStageLabel(stage: HistoryStage): string {
  switch (stage) {
    case "SHORTLIST":
      return "Shortlisted";
    case "PREFILTER":
      return "Pre-filter";
    case "ATTENDANCE":
      return "Attendance";
    case "RESULT":
      return "Result";
    default:
      return stage;
  }
}

/** Purpose: badge tone for a history result. */
export function historyResultTone(result: HistoryResult): StatusTone {
  switch (result) {
    case "SELECTED":
    case "PLACED":
    case "PRESENT":
    case "SHORTLISTED":
      return "green";
    case "REJECTED":
    case "ABSENT":
      return "red";
    case "REMOVED":
      return "gray";
    default:
      return "blue";
  }
}

/** Purpose: human label for a history result. */
export function historyResultLabel(result: HistoryResult): string {
  switch (result) {
    case "SHORTLISTED":
      return "Shortlisted";
    case "REMOVED":
      return "Removed";
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "SELECTED":
      return "Selected";
    case "REJECTED":
      return "Rejected";
    case "PLACED":
      return "Placed";
    default:
      return result;
  }
}
