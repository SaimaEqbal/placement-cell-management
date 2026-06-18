// Purpose: client-side validation rules matching the project brief's
// "Validation Rules" section for student registration, centralised here so
// every form that needs one of these fields (Registration, Complete
// Profile) shares one definition of "valid" instead of duplicating regexes.

// The backend only actually enforces the institutional domain at signup
// (server/src/controllers/authController.js: `email.endsWith("@st.jmi.ac.in")`).
// The seeded admin account (server/src/migrations/007_insert_admin.sql) uses
// a plain gmail address, so LoginPage intentionally uses the more permissive
// validateEmail() below, not this institutional-only check.
export const INSTITUTIONAL_EMAIL_DOMAIN = "@st.jmi.ac.in";
const INSTITUTIONAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@st\.jmi\.ac\.in$/i;
const GENERIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z ]{2,50}$/;
// 8+ chars, at least one upper/lower/digit/special, and no whitespace.
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*\s).{8,}$/;

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

/** Purpose: Institutional Email field rule - required, must match the college domain the backend enforces. 
export function validateInstitutionalEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Institutional email is required.";
  if (!INSTITUTIONAL_EMAIL_REGEX.test(trimmed)) {
    return `Use your institutional email (e.g. yourname${INSTITUTIONAL_EMAIL_DOMAIN}).`;
  }
  return undefined;
}
*/
export function validateInstitutionalEmail(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Institutional email is required.";
  }

  return undefined;
}
/** Purpose: generic email rule for forms that aren't restricted to the institutional domain (e.g. LoginPage, ForgotPasswordPage). */
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

/** Purpose: Current Semester field rule - required dropdown, values 1-8. */
export function validateSemester(value: string): string | undefined {
  const num = Number(value);
  if (!value || Number.isNaN(num) || num < 1 || num > 8) {
    return "Select a semester between 1 and 8.";
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
export function validateConfirmPassword(
  password: string,
  confirm: string,
): string | undefined {
  return password === confirm ? undefined : "Passwords do not match.";
}

/** Dropdown options shared by Registration and Complete Profile. */
export const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
] as const;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
