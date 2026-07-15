import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { useAllAdmins } from "../../hooks/useVerification";
import { formatDate, initialsFromName } from "../../lib/format";
import type { AdminAccountRow } from "../../services/authService";

const columns: ColumnDef<AdminAccountRow>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
    meta: { label: "Email" },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
          {initialsFromName(row.original.email)}
        </div>
        <span className="truncate font-medium">{row.original.email}</span>
      </div>
    ),
  },
  {
    id: "verified",
    accessorFn: (a) => (a.is_verified ? "Verified" : "Unverified"),
    header: "Account",
    meta: { label: "Account" },
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={row.original.is_verified ? "green" : "gray"}>
        {row.original.is_verified ? "Verified" : "Unverified"}
      </StatusBadge>
    ),
  },
  {
    id: "created",
    accessorFn: (a) => formatDate(a.created_at),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    meta: { label: "Added" },
  },
];

/**
 * Purpose: /Admin/admins - a read-only roster of every admin account
 * (GET /auth/admins), mirroring the TPCs/SPCs roster pages. New admins are
 * added through the Invitations flow.
 */
export default function AdminAdminsPage() {
  const { data: admins, isLoading, isError, error, refetch } = useAllAdmins();

  return (
    <>
      <Topbar title="Admins" subtitle="Every placement-cell admin account." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading admins..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load admins."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Accounts"
            title="All admins"
            description={`${admins?.length ?? 0} admin account(s).`}
          >
            {(admins?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<ShieldCheck />}
                title="No admins found"
                description="Invite an admin from the Invitations page."
              />
            ) : (
              <DataTable
                columns={columns}
                data={admins ?? []}
                searchPlaceholder="Search by email..."
                enableExport
                exportFileName="all-admins"
              />
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
