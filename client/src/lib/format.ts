// Purpose: small formatting helpers shared by multiple pages, kept in one
// place instead of re-implemented per component.

/** Purpose: turn a full name into up to 2 uppercase initials for avatar badges, e.g. "Jane Doe" -> "JD". */
export function initialsFromName(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "??";
}

/** Purpose: format an ISO date string (or null) into a short, human-readable date, e.g. "28 May 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Purpose: format the `cgpa` string Postgres NUMERIC columns come back as (see StudentRecord) into a fixed 2-decimal display value. */
export function formatCgpa(value: string | null | undefined): string {
  if (!value) return "-";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "-";
}

/** Purpose: human-readable label for a freeform status string, e.g. "unplaced" -> "Unplaced". */
export function capitalize(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
