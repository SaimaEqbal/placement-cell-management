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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudents } from "../../hooks/useStudents";
import { DEPARTMENTS } from "../../lib/validation";
import { paths } from "../../routes/paths";

/**
 * Purpose: /Admin/students - the Admin's student roster in a data table
 * (sortable, searchable, exportable). The department / minimum-CGPA /
 * no-active-backlogs controls filter the rows client-side; each row opens the
 * read-only detail view (/Admin/students/:id) to view or delete the record.
 */
export default function AdminStudentsPage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();

  const [department, setDepartment] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [noBacklogsOnly, setNoBacklogsOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!students) return [];
    const minCgpaNum = Number(minCgpa) || 0;
    return students.filter((s) => {
      if (department && s.department !== department) return false;
      if (minCgpaNum && Number(s.cgpa ?? 0) < minCgpaNum) return false;
      if (noBacklogsOnly && s.active_backlogs > 0) return false;
      return true;
    });
  }, [students, department, minCgpa, noBacklogsOnly]);

  const ids = filtered.map((s) => s.id);

  const columns = useMemo(
    () =>
      makeStudentColumns({
        status: (s) => (
          <StatusBadge tone={s.placement_status === "placed" ? "green" : "blue"}>
            {s.placement_status}
          </StatusBadge>
        ),
        action: (s) => (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`${paths.adminStudents}/${s.id}`}
              state={{ ids, backPath: paths.adminStudents }}
            >
              View <ArrowRight />
            </Link>
          </Button>
        ),
      }),
    [ids],
  );

  return (
    <>
      <Topbar title="Students" subtitle="Browse students and open a record to view or delete it." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Student roster"
            title="All students"
            description={`${filtered.length} of ${students?.length ?? 0} students match the current filter.`}
          >
            <DataTable
              columns={columns}
              data={filtered}
              searchPlaceholder="Search name or roll number..."
              enableExport
              exportFileName="students"
              toolbarActions={
                <>
                  <Select
                    value={department || "all"}
                    onValueChange={(v) => setDepartment(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Min CGPA"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    className="h-9 w-28"
                  />
                  <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                    <Checkbox
                      checked={noBacklogsOnly}
                      onCheckedChange={(c) => setNoBacklogsOnly(c === true)}
                    />
                    No active backlogs
                  </label>
                </>
              }
            />
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
