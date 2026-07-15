/**
 * Purpose: CGPA is no longer collected from the student - it is DERIVED from the
 * per-semester SPIs they enter, as a weighted average over completed semesters
 * only. This is the single source of truth for that policy; the Complete Profile
 * form computes CGPA from here and stores the result (there is no CGPA input).
 *
 * Policy (semester -> weight):
 *   1 -> 0.25   2 -> 0.25
 *   3 -> 0.50   4 -> 0.50
 *   5 -> 0.75   6 -> 0.75
 *   7 -> 1.00   8 -> 1.00
 *
 * A student in semester N has completed semesters 1..(N-1). Only those are
 * included - future semesters contribute to neither the numerator nor the
 * denominator.
 *
 *   CGPA = Σ(SPI_i × weight_i) / Σ(weight_i)   for completed semesters i
 */
export const SEMESTER_CGPA_WEIGHTS: Record<number, number> = {
  1: 0.25,
  2: 0.25,
  3: 0.5,
  4: 0.5,
  5: 0.75,
  6: 0.75,
  7: 1.0,
  8: 1.0,
};

/** A student in semester N has completed semesters 1..N-1. */
export function completedSemesterCount(semester: number | null | undefined): number {
  if (!semester || !Number.isFinite(semester)) return 0;
  return Math.max(0, Math.min(8, Math.floor(semester)) - 1);
}

/**
 * Weighted-average CGPA from per-semester SPIs.
 * @param spis SPI values indexed 0..7 for semesters 1..8 (string | number | null).
 * @param semester the student's current semester (5-8). Only sems 1..semester-1 count.
 * @returns the CGPA, or `null` when nothing is available to average yet.
 */
export function computeCgpa(
  spis: ReadonlyArray<string | number | null | undefined>,
  semester: number | null | undefined,
): number | null {
  const completed = completedSemesterCount(semester);
  if (completed === 0) return null;

  let weightedSum = 0;
  let weightTotal = 0;

  for (let sem = 1; sem <= completed; sem++) {
    const raw = spis[sem - 1];
    if (raw === null || raw === undefined || raw === "") continue;
    const spi = Number(raw);
    if (!Number.isFinite(spi)) continue;

    const weight = SEMESTER_CGPA_WEIGHTS[sem] ?? 0;
    weightedSum += spi * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

/** As computeCgpa, but rounded to 2 decimals for storage/display. */
export function computeCgpaRounded(
  spis: ReadonlyArray<string | number | null | undefined>,
  semester: number | null | undefined,
): number | null {
  const value = computeCgpa(spis, semester);
  return value === null ? null : Math.round(value * 100) / 100;
}
