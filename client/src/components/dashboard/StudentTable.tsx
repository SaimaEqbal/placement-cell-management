import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCgpa, initialsFromName } from "../../lib/format";

/** Minimum shape every student-list row needs; pages pass richer objects. */
export interface StudentRowData {
  id: number | string;
  name: string;
  roll_no: string;
  branch?: string | null;
  cgpa?: string | null;
}

function InitialsAvatar({ name }: { name: string }) {
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground">
      {initialsFromName(name)}
    </div>
  );
}

/**
 * Shared student roster: a real table on md+ screens and a stacked card list on
 * mobile (per the mobile-first table guidance). Status and action cells are
 * supplied by the page via render props, and `renderMeta` adds an optional line
 * under the name (e.g. an SPC rejection reason).
 */
export function StudentTable<T extends StudentRowData>({
  students,
  renderStatus,
  renderAction,
  renderMeta,
}: {
  students: T[];
  renderStatus: (student: T) => ReactNode;
  renderAction: (student: T) => ReactNode;
  renderMeta?: (student: T) => ReactNode;
}) {
  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={student.name} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.roll_no}
                      </div>
                      {renderMeta?.(student)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.branch ?? "—"}
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {formatCgpa(student.cgpa)}
                </TableCell>
                <TableCell>{renderStatus(student)}</TableCell>
                <TableCell className="text-right">
                  {renderAction(student)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <div key={student.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <InitialsAvatar name={student.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{student.name}</div>
                <div className="text-xs text-muted-foreground">
                  {student.roll_no}
                </div>
                {renderMeta?.(student)}
              </div>
              {renderStatus(student)}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {student.branch ?? "—"} · CGPA {formatCgpa(student.cgpa)}
              </div>
              {renderAction(student)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
