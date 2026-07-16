import type { StudentRecord } from "../services/studentService";

/**
 * Placement/verification breakdowns derived from the one students list, so every
 * admin page (dashboard, students, drives, TPC/SPC rosters) computes the same
 * numbers the same way.
 *
 * - `placed` counts both 'placed' and 'second_chance' (a second-chance student is
 *   still placed, just via a 2x offer); `secondChances` is that subset.
 * - `interns` = selected for an internship (an independent flag).
 * - `awaitingTpc` = SPC-approved ('spc_verified'); `awaitingSpc` = still 'pending'.
 * - `incomplete` = has a profile row but is_profile_complete is still false.
 */
export interface StudentStats {
  registered: number;
  placed: number;
  secondChances: number;
  interns: number;
  verified: number;
  awaitingTpc: number;
  awaitingSpc: number;
  incomplete: number;
}

export function computeStudentStats(students?: StudentRecord[]): StudentStats {
  const all = students ?? [];
  return {
    registered: all.length,
    placed: all.filter(
      (s) => s.placement_status === "placed" || s.placement_status === "second_chance",
    ).length,
    secondChances: all.filter((s) => s.placement_status === "second_chance").length,
    interns: all.filter((s) => s.selected_for_internship).length,
    verified: all.filter((s) => s.review_status === "verified").length,
    awaitingTpc: all.filter((s) => s.review_status === "spc_verified").length,
    awaitingSpc: all.filter((s) => s.review_status === "pending").length,
    incomplete: all.filter((s) => !s.is_profile_complete).length,
  };
}
