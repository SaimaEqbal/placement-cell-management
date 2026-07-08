import { useMemo, useState } from "react";
import { UserCheck, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { ListCard } from "@/components/dashboard/ListCard";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { StudentTable } from "@/components/dashboard/StudentTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useCompanies } from "../../hooks/useCompanies";
import { useConfirmStudents, useDrives } from "../../hooks/useDrives";
import { useStudents } from "../../hooks/useStudents";
import { DEPARTMENTS } from "../../lib/validation";

/**
 * Purpose: /Admin/students - the UPC/Admin "Filter Students" + "Shortlist
 * Students" screen. Filtering (branch, minimum CGPA, no-active-backlogs) happens
 * client-side over the cached GET /students list. Shortlisting a student into
 * the selected drive calls POST /drive/:driveId/confirm-students (useConfirmStudents),
 * adding that one student to the drive's confirmed shortlist (drive_students).
 */
export default function AdminStudentsPage() {
  const { data: students, isLoading, isError, error, refetch } = useStudents();
  const { data: companies } = useCompanies();
  const { data: drives } = useDrives();
  const confirmStudents = useConfirmStudents();

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [noBacklogsOnly, setNoBacklogsOnly] = useState(false);
  const [driveId, setDriveId] = useState("");
  const [shortlistedId, setShortlistedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!students) return [];
    const term = search.trim().toLowerCase();
    const minCgpaNum = Number(minCgpa) || 0;
    return students.filter((s) => {
      if (term && !s.name.toLowerCase().includes(term) && !s.roll_no.toLowerCase().includes(term)) {
        return false;
      }
      if (branch && s.branch !== branch) return false;
      if (minCgpaNum && Number(s.cgpa ?? 0) < minCgpaNum) return false;
      if (noBacklogsOnly && s.active_backlogs > 0) return false;
      return true;
    });
  }, [students, search, branch, minCgpa, noBacklogsOnly]);

  function handleShortlist(studentId: number) {
    if (!driveId) return;
    setShortlistedId(studentId);
    confirmStudents.mutate({ driveId: Number(driveId), studentIds: [studentId] });
  }

  return (
    <>
      <Topbar title="Students" subtitle="Filter eligible students and shortlist them for a drive." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading students..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load students."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <ListCard
            eyebrow="Eligibility filter"
            title="All students"
            description={`${filtered.length} of ${students?.length ?? 0} students match the current filter.`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name or roll number..."
                />
                <Select
                  value={branch || "all"}
                  onValueChange={(v) => setBranch(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-full sm:w-52">
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
                  className="w-28"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={noBacklogsOnly}
                    onCheckedChange={(c) => setNoBacklogsOnly(c === true)}
                  />
                  No active backlogs
                </label>
              </div>

              <Select
                value={driveId || "none"}
                onValueChange={(v) => setDriveId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a drive to shortlist into...</SelectItem>
                  {drives?.map((drive) => {
                    const companyName = companies?.find(
                      (c) => c.company_id === drive.company_id,
                    )?.company_name;
                    const label = drive.job_role
                      ? `${drive.job_role}${companyName ? ` · ${companyName}` : ""}`
                      : companyName ?? `Drive #${drive.drive_id}`;
                    return (
                      <SelectItem key={drive.drive_id} value={String(drive.drive_id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No students match this filter"
                description="Try widening the branch or CGPA filter."
              />
            ) : (
              <StudentTable
                students={filtered}
                renderStatus={(s) => (
                  <StatusBadge tone={s.placement_status === "placed" ? "green" : "blue"}>
                    {s.placement_status}
                  </StatusBadge>
                )}
                renderAction={(s) => (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={!driveId || confirmStudents.isPending}
                    onClick={() => handleShortlist(s.id)}
                  >
                    <UserCheck /> Shortlist
                  </Button>
                )}
              />
            )}

            {confirmStudents.isError && shortlistedId !== null && (
              <Alert variant="destructive">
                <AlertDescription>
                  Could not shortlist this student: {confirmStudents.error.message}
                </AlertDescription>
              </Alert>
            )}
            {confirmStudents.isSuccess && shortlistedId !== null && (
              <Alert>
                <AlertDescription>
                  Student added to the selected drive's shortlist.
                </AlertDescription>
              </Alert>
            )}
          </ListCard>
        )}
      </PageContainer>
    </>
  );
}
