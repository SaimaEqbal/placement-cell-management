import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusTone = "success" | "error" | "pending";

const toneStyles: Record<StatusTone, string> = {
  success: "bg-primary text-primary-foreground",
  error: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-foreground",
};

/**
 * Centered icon + title + description block used by the status-style auth
 * screens (verify email, forgot/reset confirmations, invite outcomes). Keeps a
 * single consistent treatment instead of per-page markup.
 */
export function AuthStatus({
  icon,
  tone = "pending",
  title,
  description,
}: {
  icon: ReactNode;
  tone?: StatusTone;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className={cn(
          "grid size-14 place-items-center rounded-full [&_svg]:size-6",
          toneStyles[tone],
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
