import { useEffect, useMemo, useState } from "react";
import { UserX, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/states";
import { useConfirmStudents } from "../../hooks/useDrives";
import { formatCgpa, initialsFromName } from "../../lib/format";
import type { EligibleStudent } from "../../services/driveService";

/**
 * Purpose: the admin review step between creating/editing a drive and confirming
 * its shortlist. The backend returns an auto-generated list of eligible students
 * (never stored) which the admin trims here; confirming persists only the chosen
 * subset into `drive_students` via POST /drive/:driveId/confirm-students.
 */
export function ShortlistReviewDialog({
  open,
  onOpenChange,
  driveId,
  driveLabel,
  eligibleStudents,
  note,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driveId: number | string | undefined;
  driveLabel?: string;
  eligibleStudents: EligibleStudent[];
  /** Optional banner, e.g. to explain a previous shortlist was cleared on edit. */
  note?: string;
  onConfirmed?: () => void;
}) {
  const confirm = useConfirmStudents();

  /** Selected student ids as strings (students.id arrives as a bigint string). */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /** Every eligible student starts selected; reset whenever the list changes or the dialog reopens. */
  useEffect(() => {
    if (open) {
      setSelected(new Set(eligibleStudents.map((s) => String(s.id))));
    }
  }, [open, eligibleStudents]);

  const allSelected =
    eligibleStudents.length > 0 && selected.size === eligibleStudents.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allSelected
        ? new Set()
        : new Set(eligibleStudents.map((s) => String(s.id))),
    );
  }

  const studentIds = useMemo(() => Array.from(selected), [selected]);

  function handleConfirm() {
    if (driveId === undefined || studentIds.length === 0) return;
    confirm.mutate(
      { driveId, studentIds },
      {
        onSuccess: () => {
          onOpenChange(false);
          onConfirmed?.();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Review eligible students</DialogTitle>
          <DialogDescription>
            {driveLabel
              ? `${driveLabel} · confirm who makes the shortlist.`
              : "Confirm who makes the shortlist for this drive."}
          </DialogDescription>
        </DialogHeader>

        {note && (
          <Alert>
            <AlertDescription>{note}</AlertDescription>
          </Alert>
        )}

        {eligibleStudents.length === 0 ? (
          <EmptyState
            icon={<UserX />}
            title="No eligible students"
            description="No verified, unplaced student matches this drive's criteria. Loosen the eligibility filters by editing the drive."
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selected.size} of {eligibleStudents.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {allSelected ? "Clear all" : "Select all"}
              </Button>
            </div>

            <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
              {eligibleStudents.map((student) => {
                const id = String(student.id);
                const checked = selected.has(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(id)}
                    />
                    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
                      {initialsFromName(student.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {student.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.roll_no} · {student.branch ?? "—"} · CGPA{" "}
                        {formatCgpa(student.cgpa as string)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {student.active_backlogs} active ·{" "}
                      {student.passive_backlogs} passive
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {confirm.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {confirm.error?.message ?? "Could not confirm the shortlist."}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {eligibleStudents.length === 0 ? "Close" : "Cancel"}
          </Button>
          {eligibleStudents.length > 0 && (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0 || confirm.isPending}
            >
              <Users />
              {confirm.isPending
                ? "Confirming..."
                : `Confirm ${selected.size} student${selected.size === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
