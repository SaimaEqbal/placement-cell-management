// Purpose: carry the non-credential fields collected at registration (full
// name, roll number, department, semester) forward to the Complete Profile
// step, since POST /auth/signup only persists email+password (see
// authService.ts's SignupPayload comment) - there's nowhere on the backend
// to store them until the student creates their actual `students` row via
// POST /students.
//
// sessionStorage, not React Context, is used deliberately: this draft has
// to survive the student leaving the tab to check their email and clicking
// the verification link - a real navigation away and back - which Context's
// in-memory state cannot survive. (See CompleteProfilePage.tsx for a note on
// why the rest of that form's step state uses plain useState instead of
// Context too.)

const DRAFT_KEY = "upms.registrationDraft";

export interface RegistrationDraft {
  fullName: string;
  rollNumber: string;
  // email carried forward so Complete Profile does not redundantly re-collect
  // the institutional email already entered at registration.
  email: string;
  department: string;
  semester: string;
}

/** Purpose: stash the registration form's identity fields right before POST /auth/signup. */
export function saveRegistrationDraft(draft: RegistrationDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Non-fatal - worst case the student retypes these fields at Complete Profile.
  }
}

/** Purpose: read back whatever was saved, e.g. to pre-fill CompleteProfilePage. */
export function readRegistrationDraft(): RegistrationDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as RegistrationDraft) : null;
  } catch {
    return null;
  }
}

/** Purpose: drop the draft once it has been used to pre-fill Complete Profile (or is no longer needed). */
export function clearRegistrationDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore.
  }
}
