import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { DataTable } from "@/components/dashboard/data-table";
import { makeStudentColumns } from "@/components/dashboard/studentColumns";
import { YearFilter } from "@/components/dashboard/YearFilter";
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
  const [year, setYear] = useState("");
  const { data: students, isLoading, isError, error, refetch } = useTpcStudents(
    undefined,
    year || undefined,
  );

  const ids = (students ?? []).map((s) => s.id);

  const columns = useMemo(
    () =>
      makeStudentColumns({
        status: (s) =>
          s.is_spc ? (
            <StatusBadge tone="blue">SPC</StatusBadge>
          ) : (
            <StatusBadge tone={reviewStatusTone(s.review_status)}>
              {reviewStatusLabel(s.review_status)}
            </StatusBadge>
          ),
        action: (s) => (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`${paths.tpcStudents}/${s.id}`}
              state={{ ids, backPath: paths.tpcStudents }}
            >
              Manage <ArrowRight />
            </Link>
          </Button>
        ),
      }),
    [ids],
  );

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
            <DataTable
              columns={columns}
              data={students ?? []}
              searchPlaceholder="Search by roll number or name..."
              enableExport
              exportFileName="department-students"
              emptyMessage="No students found."
              toolbarActions={<YearFilter value={year} onChange={setYear} />}
            />
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
