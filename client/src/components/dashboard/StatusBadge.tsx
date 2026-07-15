import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { StatusTone } from "../../types";

/**
 * Maps the app's presentational StatusTone onto the grayscale badge set. The one
 * exception to the black/white palette is the rejected/negative state, which
 * keeps a soft red so a rejection stays unmistakable and accessible.
 */
const toneToVariant: Record<
  StatusTone,
  "default" | "secondary" | "destructive" | "outline"
> = {
  green: "default", // verified / positive → solid dark
  blue: "secondary", // informational → grey fill
  amber: "outline", // pending → outline
  red: "destructive", // rejected → soft red
  gray: "outline",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return <Badge variant={toneToVariant[tone]}>{children}</Badge>;
}
