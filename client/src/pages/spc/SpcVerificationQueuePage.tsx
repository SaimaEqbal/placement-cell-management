import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { useSpcQueue } from "../../hooks/useVerification";
import { paths } from "../../routes/paths";

/**
 * Purpose: /SPC/verification - the students the TPC assigned to this SPC that
 * are still awaiting review (GET /spc/verification-queue: assigned_spc_id = me
 * AND review_status = 'pending'). Verifying/rejecting from the detail page
 * removes them from this list.
 */
export default function SpcVerificationQueuePage() {
  const { data: students, isLoading, isError, error, refetch } = useSpcQueue();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);
  const total = students?.length ?? 0;

  return (
    <>
      <Topbar title="Verification queue" subtitle="Students assigned to you, awaiting SPC review." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading verification queue..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load your queue."} onRetry={refetch} />
        )}

        {!isLoading && !isError && total === 0 && (
          <EmptyState
            icon={<ClipboardCheck />}
            title="No students assigned yet"
            description="Your TPC hasn't assigned students to you for verification, or you've reviewed them all."
          />
        )}

        {!isLoading && !isError && total > 0 && (
          <ListCard
            eyebrow="SPC verification"
            title="Student verification queue"
            description={`${total} student(s) assigned to you.`}
          >
            <div className="flex">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name or roll number..."
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck />}
                title="No matches"
                description="No assigned students match your search."
              />
            ) : (
              <StudentTable
                students={filtered}
                renderStatus={() => <StatusBadge tone="amber">Awaiting review</StatusBadge>}
                renderAction={(s) => (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`${paths.spcVerification}/${s.id}`}
                      state={{ ids, backPath: paths.spcVerification }}
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
