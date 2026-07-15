import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { useAllTpcs } from "../../hooks/useVerification";
import { formatDate, initialsFromName } from "../../lib/format";
import type { TpcRecord } from "../../services/tpcService";

const columns: ColumnDef<TpcRecord>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="TPC" />,
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
    id: "created",
    accessorFn: (t) => formatDate(t.created_at),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    meta: { label: "Added" },
  },
];

/**
 * Purpose: /Admin/tpcs - a read-only roster of every TPC account across all
 * departments (GET /tpc), in the shared DataTable. Account creation stays on the
 * Invitations flow; this is the admin's overview.
 */
export default function AdminTpcsPage() {
  const { data: tpcs, isLoading, isError, error, refetch } = useAllTpcs();

  return (
    <>
      <Topbar title="TPCs" subtitle="Every TPC account across all departments." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading TPCs..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load TPCs."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Coordinators"
            title="All TPCs"
            description={`${tpcs?.length ?? 0} TPC account(s) across all departments.`}
          >
            {(tpcs?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No TPCs yet"
                description="Invite a TPC from the Invitations page to get started."
              />
            ) : (
              <DataTable
                columns={columns}
                data={tpcs ?? []}
                searchPlaceholder="Search by name, email or department..."
                enableExport
                exportFileName="all-tpcs"
              />
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
