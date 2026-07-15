import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

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
import { useTpcBranches, useTpcSpcVerified } from "../../hooks/useVerification";
import { paths } from "../../routes/paths";

/**
 * Purpose: /TPC/spc-verified - the TPC's final-review list. Contains students
 * an SPC verified (review_status = 'spc_verified') PLUS SPC coordinators' own
 * profiles (they skip peer review - see the `is_spc` tag). Rows open the same
 * verify/reject detail as the verification queue.
 */
export default function TpcSpcVerifiedPage() {
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcSpcVerified(
    branch || undefined,
    year || undefined,
  );

  const ids = (students ?? []).map((s) => s.id);
  const total = students?.length ?? 0;

  const columns = useMemo(
    () =>
      makeStudentColumns({
        status: (s) =>
          s.is_spc ? (
            <StatusBadge tone="blue">SPC coordinator</StatusBadge>
          ) : (
            <StatusBadge tone="green">SPC verified</StatusBadge>
          ),
        action: (s) => (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`${paths.tpcVerification}/${s.id}`}
              state={{ ids, backPath: paths.tpcSpcVerified }}
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
      <Topbar title="Awaiting TPC verification" subtitle="SPC-verified students and SPC coordinators, ready for your final review." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="TPC final review"
            title="Awaiting TPC verification"
            description={`${total} student(s) ready for final approval${branch ? ` in ${branch}` : ""}.`}
          >
            {total === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="Nothing awaiting final review"
                description="No SPC-verified students or coordinators in this view."
              />
            ) : (
              <DataTable
                columns={columns}
                data={students ?? []}
                searchPlaceholder="Search name or roll number..."
                enableExport
                exportFileName="awaiting-tpc-verification"
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
