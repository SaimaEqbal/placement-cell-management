import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { BranchFilter } from "@/components/dashboard/BranchFilter";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
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
  const [search, setSearch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcSpcVerified(
    branch || undefined,
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);

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
            description={`${(students ?? []).length} student(s) ready for final approval${branch ? ` in ${branch}` : ""}.`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name or roll number..."
              />
              <BranchFilter branches={branches ?? []} value={branch} onChange={setBranch} />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="Nothing awaiting final review"
                description="No SPC-verified students or coordinators in this view."
              />
            ) : (
              <StudentTable
                students={filtered}
                renderStatus={(s) =>
                  s.is_spc ? (
                    <StatusBadge tone="blue">SPC coordinator</StatusBadge>
                  ) : (
                    <StatusBadge tone="green">SPC verified</StatusBadge>
                  )
                }
                renderAction={(s) => (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`${paths.tpcVerification}/${s.id}`}
                      state={{ ids, backPath: paths.tpcSpcVerified }}
                    >
                      Review <ArrowRight />
                    </Link>
                  </Button>
                )}
              />
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
