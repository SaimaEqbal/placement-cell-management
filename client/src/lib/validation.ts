/** Purpose: client-side validation rules, centralised here so every form that needs one of these fields (Registration, Complete Profile) shares one definition of "valid" instead of duplicating regexes.*/

export const INSTITUTIONAL_EMAIL_DOMAIN = "@st.jmi.ac.in";
const INSTITUTIONAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@st\.jmi\.ac\.in$/i;
const GENERIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z ]{2,50}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*\s).{8,}$/;

/** Purpose: Phone field rule for invited staff - required, 10 digits. */
export function validatePhone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required.";
  if (!/^\d{10}$/.test(trimmed)) {
    return "Enter a valid phone number (10-15 digits).";
  }
  return undefined;
}

/** Purpose: Full Name field rule - required, letters/spaces only, 2-50 characters. */
export function validateFullName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Full name is required.";
  if (!NAME_REGEX.test(trimmed)) {
    return "Full name must be 2-50 characters, letters and spaces only.";
  }
  return undefined;
}

/** Purpose: Roll Number field rule - required, non-empty. */
export function validateRollNumber(value: string): string | undefined {
  return value.trim() ? undefined : "Roll number is required.";
}

/** Purpose: Institutional Email field rule - required, must match the college domain the backend enforces. */
export function validateInstitutionalEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Institutional email is required.";
  if (!INSTITUTIONAL_EMAIL_REGEX.test(trimmed)) {
    return `Use your institutional email (e.g. yourname${INSTITUTIONAL_EMAIL_DOMAIN}).`;
  }
  return undefined;
}
/** Purpose: generic email rule for forms that aren't restricted to the institutional domain */
export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!GENERIC_EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

/** Purpose: Department field rule - required dropdown selection. */
export function validateDepartment(value: string): string | undefined {
  return value ? undefined : "Select a department.";
}

/** Purpose: Current Semester field rule - required dropdown. Placement students
 * are in their final years, so valid values are 5-8. */
export function validateSemester(value: string): string | undefined {
  const num = Number(value);
  if (!value || Number.isNaN(num) || num < 5 || num > 8) {
    return "Select a semester between 5 and 8.";
  }
  return undefined;
}

/** Purpose: Password field rule - 8+ chars, upper+lower+digit+special, no spaces. */
export function validatePassword(value: string): string | undefined {
  if (!PASSWORD_REGEX.test(value)) {
    return "Password needs 8+ characters with an uppercase letter, lowercase letter, digit, special character, and no spaces.";
  }
  return undefined;
}

/** Purpose: Confirm Password field rule - must exactly match the password. */
export function validateConfirmPassword(password: string, confirm: string,): string | undefined {
  return password === confirm ? undefined : "Passwords do not match.";
}

/** Purpose: generic "this field is required" rule for selects/inputs without a more specific check. */
export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}

/** Purpose: Branch field rule - required dropdown selection (options come from DEPARTMENT_BRANCHES). */
export function validateBranch(value: string): string | undefined {
  return value ? undefined : "Select a branch.";
}

/**
 * Student batches ("Batch of …") - the SINGLE SOURCE OF TRUTH for the
 * graduation-year concept across every form and filter. `label` is what users
 * pick ("2023-27"); `year` is the underlying students.batch value stored in the
 * DB (the passing-out year). Add or change a batch here and every dropdown
 * updates automatically.
 */
export const BATCH_OPTIONS = [
  { label: "2023-27", year: 2027 },
  { label: "2024-28", year: 2028 },
] as const;

/** The graduation years, e.g. for filter option lists. */
export const BATCH_YEARS = BATCH_OPTIONS.map((b) => b.year);

/** The "Batch of" label for a stored graduation year (falls back to the raw year). */
export function batchLabelForYear(year: number | string | null | undefined): string {
  if (year == null || year === "") return "—";
  const y = Number(year);
  return BATCH_OPTIONS.find((b) => b.year === y)?.label ?? String(year);
}

/** Purpose: Batch rule - required dropdown selection from BATCH_OPTIONS (value is the graduation year). */
export function validateBatch(value: string): string | undefined {
  if (!value) return "Select a batch.";
  return BATCH_OPTIONS.some((b) => String(b.year) === value)
    ? undefined
    : "Select a valid batch.";
}

/** Purpose: 10th/12th percentage rule - required number between 0 and 100. */
export function validatePercentage(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0 || num > 100) {
    return `${label} must be between 0 and 100.`;
  }
  return undefined;
}

/** Purpose: Date of birth rule - required, must be a valid, past calendar date. */
export function validateDateOfBirth(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Date of birth is required.";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "Enter a valid date of birth.";
  if (date.getTime() > Date.now()) return "Date of birth can't be in the future.";
  return undefined;
}

/** Purpose: per-semester SPI rule - required number between 0 and 10. `label` names the semester. */
export function validateSpi(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0 || num > 10) {
    return `${label} must be between 0 and 10.`;
  }
  return undefined;
}

/**
 * Department -> the branches offered within it, for the student profile form.
 * The Branch dropdown is populated from the entry matching the chosen
 * Department, so a branch can never be selected without its department.
 *
 * Keys carry the "Department of" prefix - this is the single canonical form for
 * a department across the whole app (student profile, TPC invite, admin filters,
 * and the values stored in students/tpc/spc.department). Do not add a second,
 * un-prefixed department vocabulary; every dropdown derives from these keys.
 */
export const DEPARTMENT_BRANCHES: Record<string, readonly string[]> = {
  "Department of Computer Engineering": [
    "B.Tech. Computer Engineering",
    "B.Tech. Computer Science & Engineering (Data Sciences) (Self-financed)",
  ],
  "Department of Electronics & Communication Engineering": [
    "B.Tech. (Electronics & Communication Engineering)",
    "B.Tech. Electronics (VLSI Design & Technology)",
  ],
  "Department of Electrical Engineering": [
    "B.Tech. (Electrical Engineering)",
    "B.Tech. (Electrical & Computer Engineering)",
  ],
  "Department of Mechanical Engineering": [
    "B.Tech. (Mechanical Engineering)",
    "B.Tech. (Robotics & Artificial Intelligence) (Self-Financed)",
  ],
  "Department of Civil Engineering": [
    "B.Tech. (Civil Engineering)",
    "B.Tech. Civil Engineering (Construction Technology) (Self-Financed)",
  ],
};

/** Department options for the student profile form (the keys of DEPARTMENT_BRANCHES). */
export const DEPARTMENT_OPTIONS = Object.keys(DEPARTMENT_BRANCHES);

/**
 * Dropdown options for admin filter pages. Aliased to DEPARTMENT_OPTIONS so
 * there is exactly one department vocabulary - the admin filters now compare
 * against the same strings students/TPCs are stored with.
 */
export const DEPARTMENTS = DEPARTMENT_OPTIONS;

export const SEMESTERS = [5, 6, 7, 8] as const;