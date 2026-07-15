import { Input } from "@/components/ui/input";

/**
 * A numeric "graduation year" filter input, shared by the admin students roster
 * and the TPC pages. An empty string means "no year filter". Kept as a plain
 * text/number input (not a dropdown) so any batch year can be typed, including
 * ones not yet present in the data.
 */
export function YearFilter({
  value,
  onChange,
  placeholder = "Year (e.g. 2027)",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full sm:w-40"
      aria-label="Filter by graduation year"
    />
  );
}
