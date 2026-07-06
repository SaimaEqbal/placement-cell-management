import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/** Compact metric card: neutral icon, label, big value, and a supporting note. */
export function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-5">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {note && (
            <div className="truncate text-xs text-muted-foreground">{note}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
