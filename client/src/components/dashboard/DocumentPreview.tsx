import { ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toDrivePreviewUrl } from "@/lib/drivePreview";

/**
 * Purpose: render a stored document link in a small embedded viewer window with
 * an "Open" escape hatch. Reused by the profile view and the Documents step so a
 * pasted PDF link is previewed inline instead of only linked out.
 */
export function DocumentPreview({
  label,
  url,
}: {
  label: string;
  url: string | null | undefined;
}) {
  const hasUrl = Boolean(url && url.trim());

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </div>
        {hasUrl ? (
          <Button asChild variant="outline" size="sm">
            <a href={url as string} target="_blank" rel="noreferrer">
              Open <ExternalLink />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Not provided</span>
        )}
      </div>

      {hasUrl ? (
        <iframe
          title={label}
          src={toDrivePreviewUrl(url)}
          className="h-56 w-full rounded-md border bg-muted"
        />
      ) : (
        <div className="grid h-24 place-items-center rounded-md border border-dashed text-xs text-muted-foreground">
          Paste a document link to preview it here.
        </div>
      )}
    </div>
  );
}
