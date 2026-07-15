// Placement-vs-internship rules for drives, kept in one module so the policy
// can change without touching the workflow code.
//
// Placement drives are subject to the second-chance rule (see below) and winning
// one places the student. Internship drives have NO placement criteria: anyone
// eligible may sit regardless of placement state, and winning one only sets the
// independent students.selected_for_internship flag.
//
// "Internship + PPO" is still being decided; it is currently treated as an
// INTERNSHIP. To flip it to placement behaviour, move it into
// PLACEMENT_EMPLOYMENT_TYPES - nothing else needs to change.
const PLACEMENT_EMPLOYMENT_TYPES = ["FTE"];

/** Does this drive count as a placement (vs an internship)? */
export function isPlacementDrive(employmentType) {
  return PLACEMENT_EMPLOYMENT_TYPES.includes(employmentType);
}

/**
 * The second-chance multiplier: a placed student may only sit in a placement
 * drive whose package is >= this multiple of the package they were placed at,
 * and may win such a drive exactly once (placed -> second_chance is terminal).
 */
export const SECOND_CHANCE_MULTIPLIER = 2;
