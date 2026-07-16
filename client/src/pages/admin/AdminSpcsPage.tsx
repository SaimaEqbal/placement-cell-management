import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck, UserCog } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { useStudents } from "../../hooks/useStudents";
import { useAllSpcs } from "../../hooks/useVerification";
import { computeStudentStats } from "../../lib/studentStats";
import { initialsFromName } from "../../lib/format";
import {
  batchLabelForYear,
  DEPARTMENT_BRANCHES,
  DEPARTMENTS,
} from "../../lib/validation";
import type { AdminSpcRow } from "../../services/spcService";

const columns: ColumnDef<AdminSpcRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="SPC" />,
    meta: { label: "Name" },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
          {initialsFromName(row.original.name)}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "roll_no",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Roll no" />,
    meta: { label: "Roll no" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.roll_no ?? "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    meta: { label: "Phone" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.phone ?? "—"}</span>
    ),
  },
  {
    accessorKey: "department",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    meta: { label: "Department" },
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
    accessorKey: "semester",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
    meta: { label: "Semester" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.semester ?? "—"}</span>
    ),
  },
  {
    accessorKey: "batch",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Batch" />,
    meta: { label: "Batch" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {batchLabelForYear(row.original.batch)}
      </span>
    ),
  },
];

/**
 * Purpose: /Admin/spcs - a read-only roster of every SPC coordinator across all
 * departments (GET /spc), in the shared DataTable. Management (promote/demote)
 * stays with each department's TPC; this is the admin's overview.
 */
export default function AdminSpcsPage() {
  const { data: spcs, isLoading, isError, error, refetch } = useAllSpcs();
  const students = useStudents();
  const stats = computeStudentStats(students.data);

  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");

  /** Branch options scoped to the selected department. */
  const branchOptions = department ? DEPARTMENT_BRANCHES[department] ?? [] : [];

  const filtered = useMemo(
    () =>
      (spcs ?? []).filter((sp) => {
        if (department && sp.department !== department) return false;
        if (branch && sp.branch !== branch) return false;
        return true;
      }),
    [spcs, department, branch],
  );

  return (
    <>
      <Topbar title="SPCs" subtitle="Every SPC coordinator across all departments." />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="SPCs"
            value={String(spcs?.length ?? 0)}
            note="Across all departments"
            icon={<UserCog />}
          />
          <StatCard
            label="Awaiting SPC review"
            value={String(stats.awaitingSpc)}
            note="Pending SPC verification"
            icon={<ClipboardCheck />}
          />
        </div>

        {isLoading && <LoadingState label="Loading SPCs..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load SPCs."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Coordinators"
            title="All SPCs"
            description={`${filtered.length} of ${spcs?.length ?? 0} SPC coordinator(s) match the current filter.`}
          >
            {(spcs?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<UserCog />}
                title="No SPCs yet"
                description="TPCs promote students to SPC from their department roster."
              />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                searchPlaceholder="Search by name, email or roll number..."
                enableExport
                exportFileName="all-spcs"
                toolbarActions={
                  <>
                    <Select
                      value={department || "all"}
                      onValueChange={(v) => {
                        setDepartment(v === "all" ? "" : v);
                        setBranch("");
                      }}
                    >
                      <SelectTrigger className="h-9 w-full sm:w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={branch || "all"}
                      onValueChange={(v) => setBranch(v === "all" ? "" : v)}
                      disabled={!department}
                    >
                      <SelectTrigger className="h-9 w-full sm:w-52">
                        <SelectValue placeholder="All branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {department ? "All branches of the dept" : "All branches"}
                        </SelectItem>
                        {branchOptions.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                }
              />
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
