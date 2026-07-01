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
export function validateConfirmPassword(password: string, confirm: string,): string | undefined {
  return password === confirm ? undefined : "Passwords do not match.";
}
/** Dropdown options in Complete Profile. */
export const DEPARTMENTS = [ "Department Of Computer Engineering", "Department Of Electronics & Communication Engineering", "Department Of Electrical Engineering", "Department Of Mechanical Engineering", "Department Of Civil Engineering" ] as const;

/**
 * Department -> the branches offered within it, for the student profile form.
 * The Branch dropdown is populated from the entry matching the chosen
 * Department, so a branch can never be selected without its department.
 */
export const DEPARTMENT_BRANCHES: Record<string, readonly string[]> = {
  "Computer Engineering": [
    "B.Tech. Computer Engineering",
    "B.Tech. Computer Science & Engineering (Data Sciences) (Self-financed)",
  ],
  "Electronics & Communication Engineering": [
    "B.Tech. (Electronics & Communication Engineering)",
    "B.Tech. Electronics (VLSI Design & Technology)",
  ],
  "Electrical Engineering": [
    "B.Tech. (Electrical Engineering)",
    "B.Tech. (Electrical & Computer Engineering)",
  ],
  "Mechanical Engineering": [
    "B.Tech. (Mechanical Engineering)",
    "B.Tech. (Robotics & Artificial Intelligence) (Self-Financed)",
  ],
  "Civil Engineering": [
    "B.Tech. (Civil Engineering)",
    "B.Tech. Civil Engineering (Construction Technology) (Self-Financed)",
  ],
};

/** Department options for the student profile form (the keys of DEPARTMENT_BRANCHES). */
export const DEPARTMENT_OPTIONS = Object.keys(DEPARTMENT_BRANCHES);

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;