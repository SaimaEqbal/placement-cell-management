import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { useTpcStudents } from "../../hooks/useVerification";
import { reviewStatusLabel, reviewStatusTone } from "../../lib/reviewStatus";
import { paths } from "../../routes/paths";

/**
 * Purpose: /TPC/students - every student in the TPC's department, searchable by
 * roll number. Each row opens the management detail view (promote to SPC /
 * demote / delete). SPC coordinators are tagged.
 */
export default function TpcStudentsPage() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading, isError, error, refetch } = useTpcStudents();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = students ?? [];
    if (!term) return list;
    return list.filter(
      (s) => s.roll_no.toLowerCase().includes(term) || s.name.toLowerCase().includes(term),
    );
  }, [students, search]);

  const ids = filtered.map((s) => s.id);

  return (
    <>
      <Topbar title="Students" subtitle="Everyone in your department. Search by roll number." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Department roster"
            title="Students"
            description={`${(students ?? []).length} student(s) in your department.`}
          >
            <div className="flex">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by roll number or name..."
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No students found"
                description="Try a different roll number."
              />
            ) : (
              <StudentTable
                students={filtered}
                renderStatus={(s) =>
                  s.is_spc ? (
                    <StatusBadge tone="blue">SPC</StatusBadge>
                  ) : (
                    <StatusBadge tone={reviewStatusTone(s.review_status)}>
                      {reviewStatusLabel(s.review_status)}
                    </StatusBadge>
                  )
                }
                renderAction={(s) => (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`${paths.tpcStudents}/${s.id}`}
                      state={{ ids, backPath: paths.tpcStudents }}
                    >
                      Manage <ArrowRight />
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
