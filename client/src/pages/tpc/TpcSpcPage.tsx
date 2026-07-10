import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UserCog, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignSpc, useTpcBranches, useTpcSpcs } from "../../hooks/useVerification";
import type { TpcSpcRow } from "../../services/tpcService";
import { initialsFromName } from "../../lib/format";

/**
 * Purpose: /TPC/coordinators - pick a branch, see its SPCs in a table (ordered
 * by spc_id), and click "Assign students to SPC for verification" to divide that
 * branch's students evenly among its SPCs (per semester). Only assigned students
 * appear in an SPC's verification queue.
 */
export default function TpcSpcPage() {
  const [branch, setBranch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: spcs, isLoading, isError, error, refetch } = useTpcSpcs(branch || undefined);
  const assign = useAssignSpc();
  const result = assign.data;

  const canAssign = Boolean(branch) && (spcs?.length ?? 0) > 0 && !assign.isPending;

  const columns: ColumnDef<TpcSpcRow>[] = [
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
      accessorKey: "semester",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
      meta: { label: "Semester" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.semester ?? "—"}</span>
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
      id: "assigned",
      header: () => <div className="text-right">Assigned</div>,
      enableSorting: false,
      meta: { label: "Assigned", align: "right", exportValue: (s) => result?.perSpc?.[s.spc_id] ?? 0 },
      cell: ({ row }) =>
        result?.perSpc?.[row.original.spc_id] != null ? (
          <StatusBadge tone="green">{String(result.perSpc[row.original.spc_id])}</StatusBadge>
        ) : (
          <span className="text-muted-foreground">#{row.original.spc_id}</span>
        ),
    },
  ];

  return (
    <>
      <Topbar title="SPC coordinators" subtitle="Assign students to SPCs for verification, by branch." />
      <PageContainer>
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                SPC assignment
              </span>
              <CardTitle className="text-lg">Coordinators by branch</CardTitle>
              <CardDescription>
                Pick a branch, then split its students among its SPCs (evenly, per semester).
              </CardDescription>
            </div>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => assign.mutate(branch)}
              disabled={!canAssign}
            >
              {assign.isPending ? "Assigning..." : "Assign students to SPC"}
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex">
              <Select
                value={branch}
                onValueChange={(next) => {
                  setBranch(next);
                  assign.reset();
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {(branches ?? []).map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assign.isError && (
              <Alert variant="destructive">
                <AlertDescription>{assign.error.message}</AlertDescription>
              </Alert>
            )}
            {result && (
              <Alert>
                <AlertDescription>
                  Assigned {result.totalAssigned} student(s) across{" "}
                  {Object.keys(result.perSpc).length} SPC(s). Counts are shown per SPC below.
                </AlertDescription>
              </Alert>
            )}

            {!branch ? (
              <EmptyState
                icon={<UserCog />}
                title="Select a branch"
                description="Choose a branch to see its SPCs and assign students."
              />
            ) : isLoading ? (
              <LoadingState label="Loading SPCs..." />
            ) : isError ? (
              <ErrorState message={error?.message ?? "Could not load SPCs."} onRetry={refetch} />
            ) : (spcs?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No SPCs in this branch"
                description="Promote a student to SPC from the Students section first."
              />
            ) : (
              <DataTable
                columns={columns}
                data={spcs ?? []}
                searchPlaceholder="Search SPC by name or roll number..."
                enableExport
                exportFileName={`spc-coordinators-${branch}`}
              />
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
