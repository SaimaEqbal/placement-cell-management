import * as XLSX from "xlsx";

import type { DriveStudent } from "../services/driveService";

/**
 * Purpose: export a printable attendance sheet (.xlsx) for a round's students.
 * Coordinators print it, take attendance on paper (tick the Present column /
 * sign), then enter it back into the app. Reuses the same `xlsx` dependency the
 * data-table export uses.
 */
export function exportAttendanceSheet(
  students: DriveStudent[],
  driveLabel: string,
  roundNo: number,
): void {
  const header = ["#", "Roll No", "Name", "Branch", "Present (tick)", "Signature"];
  const aoa: Array<Array<string | number>> = [
    [`Attendance Sheet — ${driveLabel} — Round ${roundNo}`],
    [`Total students: ${students.length}`],
    [],
    header,
    ...students.map((s, i) => [i + 1, s.roll_no, s.name, s.branch ?? "", "", ""]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet["!cols"] = [
    { wch: 4 },
    { wch: 14 },
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Round ${roundNo}`);
  XLSX.writeFile(workbook, `attendance-round-${roundNo}.xlsx`);
}
