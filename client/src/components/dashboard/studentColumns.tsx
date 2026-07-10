import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/dashboard/data-table";
import { formatCgpa, initialsFromName } from "../../lib/format";
import type { StudentRecord } from "../../services/studentService";

export interface StudentColumnsOptions {
  /** Status cell (a badge) - varies per list (queue vs verified vs roster). */
  status: (student: StudentRecord) => ReactNode;
  /** Row action cell (e.g. a Review / Manage / View button). */
  action: (student: StudentRecord) => ReactNode;
  /** Optional sub-line under the name (e.g. an SPC rejection reason). */
  meta?: (student: StudentRecord) => ReactNode;
}

/**
 * Purpose: the shared column set for every student list (SPC/TPC queues, TPC
 * roster, admin students). Roll no / Name / Branch / CGPA are real sortable,
 * searchable, exportable data columns; Status and Action are page-supplied via
 * render callbacks. Feed the result to <DataTable columns={...} data={students} />.
 */
export function makeStudentColumns({
  status,
  action,
  meta,
}: StudentColumnsOptions): ColumnDef<StudentRecord>[] {
  return [
    {
      accessorKey: "roll_no",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Roll no" />,
      meta: { label: "Roll no" },
      cell: ({ row }) => <span className="font-medium">{row.original.roll_no}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      meta: { label: "Name" },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
            {initialsFromName(row.original.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            {meta?.(row.original)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "branch",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Branch" />,
      meta: { label: "Branch" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.branch ?? "—"}</span>
      ),
    },
    {
      accessorKey: "cgpa",
      header: ({ column }) => <DataTableColumnHeader column={column} title="CGPA" />,
      meta: { label: "CGPA", align: "right", exportValue: (s) => (s.cgpa != null ? Number(s.cgpa) : "") },
      // cgpa is a NUMERIC returned as a string; sort numerically, not lexically.
      sortingFn: (a, b) => (Number(a.original.cgpa) || 0) - (Number(b.original.cgpa) || 0),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{formatCgpa(row.original.cgpa)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => status(row.original),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => <div className="flex justify-end">{action(row.original)}</div>,
    },
  ];
}
