import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BATCH_OPTIONS } from "@/lib/validation";

/**
 * Batch ("Batch of …") filter dropdown, shared by the admin students roster and
 * the TPC pages. Options come from BATCH_OPTIONS (the single source of truth in
 * validation.ts); the value is the underlying graduation year as a string, and
 * an empty string means "All batches". Radix Select can't use "" as an item
 * value, so the sentinel "all" is translated at the boundary (like BranchFilter).
 */
export function YearFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => onChange(next === "all" ? "" : next)}
    >
      <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by batch">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All batches</SelectItem>
        {BATCH_OPTIONS.map((b) => (
          <SelectItem key={b.year} value={String(b.year)}>
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
