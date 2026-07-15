import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./Field";
import { DocumentPreview } from "./DocumentPreview";
import type { PostAttachmentInput } from "@/services/companyPostService";

/**
 * Purpose: the shared, dynamic attachment editor. Manages a list of pasted
 * Google Drive links (name + URL) with add/remove, and previews each link
 * inline through the reusable DocumentPreview. Extracted so both the
 * announcement form (Phase 1) and the drive-creation announcement fields
 * (Phase 2) use exactly one attachment editor. Zero attachments is valid; the
 * caller validates that any present row has both a name and a URL.
 */
export function AttachmentEditor({
  value,
  onChange,
}: {
  value: PostAttachmentInput[];
  onChange: (next: PostAttachmentInput[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<PostAttachmentInput>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeRow = (index: number) =>
    onChange(value.filter((_, i) => i !== index));
  const addRow = () => onChange([...value, { file_name: "", file_url: "" }]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium">Attachments</div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No attachments. Add a Google Drive link for each document.
        </p>
      )}

      {value.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
            <Field label="Name" htmlFor={`att-name-${index}`}>
              <Input
                id={`att-name-${index}`}
                value={row.file_name}
                onChange={(e) => updateRow(index, { file_name: e.target.value })}
                placeholder="Job Description"
                autoComplete="off"
              />
            </Field>
            <Field label="Google Drive URL" htmlFor={`att-url-${index}`}>
              <Input
                id={`att-url-${index}`}
                value={row.file_url}
                onChange={(e) => updateRow(index, { file_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                autoComplete="off"
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove attachment"
              className="justify-self-end text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(index)}
            >
              <Trash2 />
            </Button>
          </div>
          {row.file_url.trim() && (
            <DocumentPreview label={row.file_name || "Attachment"} url={row.file_url} />
          )}
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus /> Add attachment
        </Button>
      </div>
    </div>
  );
}
