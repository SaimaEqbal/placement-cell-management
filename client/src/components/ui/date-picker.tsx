import * as React from "react";
import { CalendarIcon, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Parse a "YYYY-MM-DD" string into a local Date (no timezone shift). */
function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Format a Date back into a "YYYY-MM-DD" string using local parts. */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Sentinel emitted by `onChange` when the user marks a date "to be determined".
 * It's a non-date string so it never collides with a "YYYY-MM-DD" value, and
 * consumers can check `value === TBD_DATE` to branch (validation, payload, etc.).
 */
export const TBD_DATE = "TBD";

export interface DatePickerProps {
  /** Value as a "YYYY-MM-DD" string, or TBD_DATE when marked to-be-determined. */
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Restrict selectable range with "YYYY-MM-DD" strings. */
  fromDate?: string;
  toDate?: string;
  /** Show a "To be determined (TBD)" option in the picker. Defaults to false. */
  allowTbd?: boolean;
  /** Label for the TBD option/trigger. Defaults to "TBD". */
  tbdLabel?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date",
  disabled,
  className,
  fromDate,
  toDate,
  allowTbd = false,
  tbdLabel = "TBD",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isTbd = value === TBD_DATE;
  const selected = isTbd ? undefined : parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && !isTbd && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon />
          {isTbd
            ? tbdLabel
            : selected
              ? selected.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : placeholder}
        </Button>
      </PopoverTrigger>
      {/* pointer-events-auto: when the picker is used inside a modal Radix Dialog,
          the Dialog sets `pointer-events: none` on <body>, and this content is
          portaled to <body> (outside DialogContent), so it inherits the lock and
          day clicks never register. Re-enable it here so the calendar is always
          interactive. */}
      <PopoverContent className="pointer-events-auto w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          defaultMonth={selected}
          startMonth={parseDate(fromDate)}
          endMonth={parseDate(toDate)}
          disabled={[
            ...(fromDate ? [{ before: parseDate(fromDate)! }] : []),
            ...(toDate ? [{ after: parseDate(toDate)! }] : []),
          ]}
          onSelect={(date) => {
            onChange(date ? formatDate(date) : "");
            setOpen(false);
          }}
        />
        {allowTbd && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant={isTbd ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start font-normal"
              onClick={() => {
                onChange(TBD_DATE);
                setOpen(false);
              }}
            >
              <HelpCircle />
              To be determined ({tbdLabel})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
