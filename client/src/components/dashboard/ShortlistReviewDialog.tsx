import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, UserX, Users } from "lucide-react";

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
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useConfirmStudents } from "../../hooks/useDrives";
import { formatCgpa, initialsFromName } from "../../lib/format";
import type { EligibleStudent, ShortlistEntry } from "../../services/driveService";

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
  shortlist,
  note,
  loading = false,
  onBack,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driveId: number | string | undefined;
  driveLabel?: string;
  eligibleStudents: EligibleStudent[];
  /**
   * The drive's saved shortlist. Empty/absent = first build (every eligible student
   * starts selected). Non-empty = edit: checkboxes are seeded from the saved
   * shortlist (selected stay checked, withdrawn shown locked, others unchecked).
   */
  shortlist?: ShortlistEntry[];
  /** Optional banner, e.g. to explain a previous shortlist was cleared on edit. */
  note?: string;
  /** Show a loading state while the eligible list is being (re)generated. */
  loading?: boolean;
  /** Back returns to the drive constraints (create/edit) form. */
  onBack?: () => void;
  onConfirmed?: () => void;
}) {
  const confirm = useConfirmStudents();

  /** True once the drive has a saved shortlist - i.e. this is an edit, not a first build. */
  const isEdit = (shortlist?.length ?? 0) > 0;

  /** Ids of withdrawn students (locked, shown but not selectable). */
  const withdrawnIds = useMemo(
    () => new Set((shortlist ?? []).filter((s) => !s.is_active).map((s) => String(s.id))),
    [shortlist],
  );

  /**
   * The display list = the eligible universe plus any saved shortlist students no
   * longer eligible (so previously-selected/withdrawn students never disappear),
   * de-duplicated by id.
   */
  const displayed = useMemo(() => {
    const map = new Map<string, EligibleStudent & { is_active?: boolean }>();
    for (const s of eligibleStudents) map.set(String(s.id), s);
    for (const s of shortlist ?? []) if (!map.has(String(s.id))) map.set(String(s.id), s);
    return Array.from(map.values());
  }, [eligibleStudents, shortlist]);

  /** Students the admin can actually toggle (everyone except the withdrawn). */
  const selectable = useMemo(
    () => displayed.filter((s) => !withdrawnIds.has(String(s.id))),
    [displayed, withdrawnIds],
  );

  /** Selected student ids as strings (students.id arrives as a bigint string). */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /**
   * Seed the selection when the dialog opens or its data changes: a first build
   * selects every eligible student; an edit seeds from the saved shortlist
   * (active-selected checked, everyone else unchecked). Withdrawn are never selected.
   */
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setSelected(
        new Set(
          (shortlist ?? [])
            .filter((s) => s.is_active)
            .map((s) => String(s.id)),
        ),
      );
    } else {
      setSelected(new Set(eligibleStudents.map((s) => String(s.id))));
    }
  }, [open, eligibleStudents, shortlist, isEdit]);

  const allSelected =
    selectable.length > 0 && selected.size === selectable.length;

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
      allSelected ? new Set() : new Set(selectable.map((s) => String(s.id))),
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

        {loading ? (
          <LoadingState label="Generating eligible list..." />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<UserX />}
            title="No eligible students"
            description="No verified, unplaced student matches this drive's criteria. Loosen the eligibility filters by editing the drive."
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selected.size} of {selectable.length} selected
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
              {displayed.map((student) => {
                const id = String(student.id);
                const withdrawn = withdrawnIds.has(id);
                const checked = selected.has(id);
                return (
                  <label
                    key={id}
                    className={
                      withdrawn
                        ? "flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-60"
                        : "flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    }
                  >
                    <Checkbox
                      checked={withdrawn ? false : checked}
                      disabled={withdrawn}
                      onCheckedChange={() => !withdrawn && toggle(id)}
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
                    {withdrawn ? (
                      <StatusBadge tone="red">Withdrawn</StatusBadge>
                    ) : (
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        {student.active_backlogs} active ·{" "}
                        {student.passive_backlogs} passive
                      </div>
                    )}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => (onBack ? onBack() : onOpenChange(false))}
          >
            <ArrowLeft /> Back
          </Button>
          {!loading && displayed.length > 0 && (
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
