import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Purpose: a reusable confirmation dialog built on the shadcn AlertDialog, so
 * destructive/irreversible actions (delete, promote, demote, ...) get a
 * consistent, accessible modal instead of the native window.confirm.
 *
 * Two modes:
 *  - Uncontrolled: pass `trigger` (e.g. a <Button>) that opens the dialog.
 *  - Controlled: pass `open` + `onOpenChange` and omit `trigger` - useful when
 *    the opener lives in a menu that unmounts on click (e.g. a dropdown item).
 */
export interface ConfirmDialogProps {
  /** The element that opens the dialog. Omit when using `open`/`onOpenChange`. */
  trigger?: ReactNode;
  /** Controlled open state (pair with onOpenChange). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Confirm-button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Style the confirm action as destructive (red). */
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
