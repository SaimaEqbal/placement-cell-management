import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const block =
  "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center";

/** Shown while a query/mutation is in flight. */
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className={block}>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/** Shown when a query fails; `onRetry` is optional (some errors aren't worth retrying). */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={block}>
      <AlertTriangle className="size-6 text-destructive" />
      <span className="max-w-sm text-sm text-muted-foreground">{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" type="button" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Shown when a query succeeds but returns nothing. */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className={block}>
      <div className="text-muted-foreground [&_svg]:size-7">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="max-w-sm text-sm text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
}
