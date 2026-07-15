import type { ColumnDef } from "@tanstack/react-table";
import { UserCog } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { useAllSpcs } from "../../hooks/useVerification";
import { initialsFromName } from "../../lib/format";
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
    accessorKey: "graduation_year",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Batch" />,
    meta: { label: "Batch" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.graduation_year ?? "—"}</span>
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

  return (
    <>
      <Topbar title="SPCs" subtitle="Every SPC coordinator across all departments." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading SPCs..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load SPCs."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Coordinators"
            title="All SPCs"
            description={`${spcs?.length ?? 0} SPC coordinator(s) across all departments.`}
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
                data={spcs ?? []}
                searchPlaceholder="Search by name, email or roll number..."
                enableExport
                exportFileName="all-spcs"
              />
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
