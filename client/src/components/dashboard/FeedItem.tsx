import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One entry in an activity/notification/announcement feed: a neutral icon, a
 * title, and a meta line. Optionally clickable (e.g. mark-as-read) and can show
 * an unread emphasis.
 */
export function FeedItem({
  icon,
  title,
  meta,
  unread,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  meta: ReactNode;
  unread?: boolean;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "flex gap-3 rounded-lg border p-3 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50",
        unread && "bg-muted/40",
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {unread && (
            <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}
