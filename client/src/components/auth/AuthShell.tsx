import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

/** Placement-cell wordmark used across the auth screens. */
export function AuthBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Landmark className="size-5" />
      </div>
      <div className="text-left leading-tight">
        <div className="text-sm font-semibold tracking-tight">
          University Placement Cell
        </div>
        <div className="text-xs text-muted-foreground">
          Jamia Millia Islamia
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen, mobile-first wrapper for every auth page: centers the brand and a
 * single content column (usually a Card) on a neutral background. Keeps the auth
 * flow visually consistent instead of each page inventing its own layout.
 */
export function AuthShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <AuthBrand />
      <div className={cn("w-full max-w-md", className)}>{children}</div>
    </main>
  );
}

/** Consistent "Back to sign in" style link shown at the foot of auth cards. */
export function AuthBackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline"
    >
      {children}
    </Link>
  );
}
