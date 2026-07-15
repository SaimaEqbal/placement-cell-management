import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { BranchFilter } from "@/components/dashboard/BranchFilter";
import { YearFilter } from "@/components/dashboard/YearFilter";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { DataTable } from "@/components/dashboard/data-table";
import { makeStudentColumns } from "@/components/dashboard/studentColumns";
import { Button } from "@/components/ui/button";
import { useTpcBranches, useTpcQueue } from "../../hooks/useVerification";
import { paths } from "../../routes/paths";

/**
 * Purpose: /TPC/verification - students an SPC rejected (review_status =
 * 'spc_rejected'), now awaiting TPC review, with the SPC's reason shown inline.
 * Filterable by branch (branches under the TPC's department).
 */
export default function TpcVerificationQueuePage() {
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcQueue(
    branch || undefined,
    year || undefined,
  );

  const ids = (students ?? []).map((s) => s.id);
  const total = students?.length ?? 0;

  const columns = useMemo(
    () =>
      makeStudentColumns({
        status: () => <StatusBadge tone="red">SPC rejected</StatusBadge>,
        meta: (s) =>
          s.rejection_reason ? (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              SPC: {s.rejection_reason}
            </div>
          ) : null,
        action: (s) => (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`${paths.tpcVerification}/${s.id}`}
              state={{ ids, backPath: paths.tpcVerification }}
            >
              Review <ArrowRight />
            </Link>
          </Button>
        ),
      }),
    [ids],
  );

  return (
    <>
      <Topbar title="Verification queue" subtitle="Students rejected by an SPC, awaiting your review." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading verification queue..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load the queue."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="TPC verification"
            title="SPC-rejected students"
            description={`${total} student(s) awaiting your review${branch ? ` in ${branch}` : ""}.`}
          >
            {total === 0 ? (
              <EmptyState
                icon={<ClipboardCheck />}
                title="Nothing waiting for review"
                description="No SPC-rejected students in this view."
              />
            ) : (
              <DataTable
                columns={columns}
                data={students ?? []}
                searchPlaceholder="Search name or roll number..."
                enableExport
                exportFileName="tpc-verification-queue"
                toolbarActions={
                  <>
                    <BranchFilter branches={branches ?? []} value={branch} onChange={setBranch} />
                    <YearFilter value={year} onChange={setYear} />
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
