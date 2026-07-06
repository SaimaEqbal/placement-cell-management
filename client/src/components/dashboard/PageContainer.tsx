import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Consistent padded, width-capped wrapper for the main content of every
 *  dashboard page (replaces the legacy `.dashboard-content`). */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
