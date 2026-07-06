import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { BranchFilter } from "@/components/dashboard/BranchFilter";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
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
  const [search, setSearch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: students, isLoading, isError, error, refetch } = useTpcQueue(
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
            description={`${(students ?? []).length} student(s) awaiting your review${branch ? ` in ${branch}` : ""}.`}
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
                icon={<ClipboardCheck />}
                title="Nothing waiting for review"
                description="No SPC-rejected students in this view."
              />
            ) : (
              <StudentTable
                students={filtered}
                renderMeta={(s) =>
                  s.rejection_reason ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      SPC: {s.rejection_reason}
                    </div>
                  ) : null
                }
                renderStatus={() => <StatusBadge tone="red">SPC rejected</StatusBadge>}
                renderAction={(s) => (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`${paths.tpcVerification}/${s.id}`}
                      state={{ ids, backPath: paths.tpcVerification }}
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
