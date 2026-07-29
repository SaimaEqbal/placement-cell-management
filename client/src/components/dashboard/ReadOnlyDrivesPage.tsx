import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Eye, Megaphone } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import Topbar from "../Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable, DataTableColumnHeader } from "@/components/dashboard/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrives } from "../../hooks/useDrives";
import { roundDisplayName } from "../../lib/driveStatus";
import { formatDate } from "../../lib/format";
import type { DriveRecord } from "../../services/driveService";

/**
 * Purpose: a read-only listing of every placement/internship drive, shared by the
 * SPC and TPC roles. It mirrors the admin Drives table but drops all management
 * controls: the rightmost column carries a single "View status" action that opens
 * the drive's read-only progress view (reusing the admin round-history display) at
 * `${basePath}/:driveId`.
 */
export function ReadOnlyDrivesPage({
  basePath,
  subtitle = "Track how each drive is progressing.",
}: {
  /** Route prefix the "View status" link is built from (e.g. paths.spcDrives). */
  basePath: string;
  subtitle?: string;
}) {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();

  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  const columns: ColumnDef<DriveRecord>[] = [
    {
      id: "company",
      accessorFn: (d) => companyNameById.get(d.company_id) ?? `#${d.company_id}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      meta: { label: "Company" },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {companyNameById.get(row.original.company_id) ?? `#${row.original.company_id}`}
          </div>
          {row.original.job_role && (
            <div className="truncate text-xs text-muted-foreground">{row.original.job_role}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "employment_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
    },
    {
      id: "status",
      accessorFn: (d) => d.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      meta: { label: "Status" },
      cell: ({ row }) => {
        const s = row.original.status;
        const tone =
          s === "completed" ? "green" : s === "ongoing" ? "blue" : s === "cancelled" ? "red" : "gray";
        return <StatusBadge tone={tone}>{s}</StatusBadge>;
      },
    },
    {
      id: "in_round",
      accessorFn: (d) => d.current_round_count ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="In round" />,
      meta: { label: "In round" },
      cell: ({ row }) =>
        row.original.drive_state === "SHORTLISTING"
          ? <span className="text-muted-foreground">—</span>
          : String(row.original.current_round_count ?? 0),
    },
    {
      id: "next_round",
      header: "Next round",
      enableSorting: false,
      meta: { label: "Next round" },
      cell: ({ row }) => {
        const d = row.original;
        if (d.drive_state !== "ROUND_IN_PROGRESS")
          return <span className="text-muted-foreground">—</span>;
        return (
          <div className="min-w-0">
            <div className="truncate">
              {roundDisplayName(d.current_round, d.current_round_name)}
            </div>
            <div className="text-xs text-muted-foreground">
              {d.current_round_date ? formatDate(d.current_round_date) : "TBD"}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to={`${basePath}/${row.original.drive_id}`}>
              <Eye /> View status
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Placement & internship drives" subtitle={subtitle} />
      <PageContainer>
        {isLoading && <LoadingState label="Loading drives..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load drives."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!drives || drives.length === 0) && (
          <EmptyState
            icon={<Megaphone />}
            title="No drives announced yet"
            description="Drives created by the placement cell will appear here."
          />
        )}

        {!isLoading && !isError && drives && drives.length > 0 && (
          <DataTable
            columns={columns}
            data={drives}
            searchPlaceholder="Search company or role .."
            enableExport
            exportFileName="drives"
          />
        )}
      </PageContainer>
    </>
  );
}
