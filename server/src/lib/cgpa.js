// Backend-authoritative CGPA. CGPA is NOT a student-controlled field: it is
// derived from the per-semester SPIs, as a weighted average over completed
// semesters only. This mirrors client/src/lib/cgpa.ts exactly (same weights and
// rounding) so preview and stored value agree, but the stored value is computed
// here and is the source of truth.
//
// Policy (semester -> weight): 1,2 -> 0.25 · 3,4 -> 0.50 · 5,6 -> 0.75 · 7,8 -> 1.00
// A student in semester N has completed semesters 1..N-1; only those count.
//   CGPA = Σ(SPI_i × weight_i) / Σ(weight_i)   for completed semesters i

export const SEMESTER_CGPA_WEIGHTS = {
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
export function completedSemesterCount(semester) {
  const n = Number(semester);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(8, Math.floor(n)) - 1);
}

/**
 * Weighted-average CGPA from per-semester SPIs.
 * @param {Array} spis SPI values indexed 0..7 for semesters 1..8.
 * @param {number} semester the student's current semester (5-8).
 * @returns {number|null} CGPA, or null when nothing is available to average yet.
 */
export function computeCgpa(spis, semester) {
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

/** As computeCgpa, but rounded to 2 decimals for storage. */
export function computeCgpaRounded(spis, semester) {
  const value = computeCgpa(spis, semester);
  return value === null ? null : Math.round(value * 100) / 100;
}
