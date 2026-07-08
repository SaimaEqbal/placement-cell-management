import { useMemo } from "react";
import { Briefcase } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrives } from "../../hooks/useDrives";
import { formatDate } from "../../lib/format";

/**
 * Purpose: /Student/drives - a read-only listing of the placement drives the
 * cell has announced (GET /drive). Students no longer apply themselves: the
 * placement cell reviews an auto-generated eligible list and confirms the
 * shortlist, so this page is informational only.
 */
export default function PlacementDrivesPage() {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();

  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  return (
    <>
      <Topbar
        title="Placement drives"
        subtitle="Drives announced by the placement cell. Eligible students are shortlisted by the cell."
      />
      <PageContainer>
        {isLoading && <LoadingState label="Loading placement drives..." />}

        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load placement drives."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!drives || drives.length === 0) && (
          <EmptyState
            icon={<Briefcase />}
            title="No placement drives yet"
            description="The placement cell hasn't announced any drives yet. Check back soon."
          />
        )}

        {!isLoading && !isError && drives && drives.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {drives.map((drive) => {
              const companyName =
                companyNameById.get(drive.company_id) ??
                `Company #${drive.company_id}`;
              return (
                <Card key={drive.drive_id} className="flex flex-col">
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {drive.job_role || companyName}
                      </CardTitle>
                      <CardDescription>{companyName}</CardDescription>
                    </div>
                    <StatusBadge tone="blue">{drive.status}</StatusBadge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      {drive.job_description ?? "No description provided."}
                    </p>
                    <InfoGrid
                      items={[
                        ["Type", drive.employment_type],
                        ["Package (LPA)", drive.package_ctc ?? "—"],
                        ["Min CGPA", String(drive.minimum_cgpa)],
                        ["Deadline", formatDate(drive.application_deadline)],
                        ["Drive date", formatDate(drive.drive_date)],
                        ["Max active backlogs", String(drive.max_active_backlogs)],
                        ["Max passive backlogs", String(drive.max_passive_backlogs)],
                        ["Branches", drive.allowed_branches?.join(", ") || "—"],
                      ]}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
