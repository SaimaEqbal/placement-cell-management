import { useMemo } from "react";
import { Briefcase } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrives } from "../../hooks/useDrives";
import {
  useApplyForDrive,
  useStudentApplications,
  useWithdrawApplication,
} from "../../hooks/useApplications";
import { useProfile } from "../../hooks/useProfile";
import { formatDate } from "../../lib/format";
import type { ApplicationRecord } from "../../services/applicationService";
import type { StatusTone } from "../../types";

/** Purpose: tone for an application's workflow status. */
function statusTone(status: string): StatusTone {
  switch (status) {
    case "selected":
    case "approved":
      return "green";
    case "rejected":
    case "not_selected":
      return "red";
    case "pending":
      return "amber";
    default:
      return "blue";
  }
}

/**
 * Purpose: /Student/drives - lists real placement drives (GET /drive) and lets
 * the signed-in student apply (POST /application/apply/:driveId) or withdraw
 * (DELETE /application/:applicationId). Company names are resolved from the
 * cached GET /companies list; the student's numeric id (needed as student_id
 * when applying) comes from their profile (GET /students/me).
 */
export default function PlacementDrivesPage() {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();
  const { data: profile } = useProfile();
  const studentId = profile?.id;

  const { data: applications } = useStudentApplications(studentId);
  const applyForDrive = useApplyForDrive();
  const withdraw = useWithdrawApplication(studentId);

  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  /** drive_id -> the student's existing application, so we can show status/withdraw. */
  const applicationByDrive = useMemo(() => {
    const map = new Map<number, ApplicationRecord>();
    applications?.forEach((a) => map.set(a.drive_id, a));
    return map;
  }, [applications]);

  return (
    <>
      <Topbar
        title="Placement drives"
        subtitle="Drives currently open through the placement cell."
      />
      <PageContainer>
        {!profile && (
          <p className="text-sm text-muted-foreground">
            Complete your profile to apply for drives.
          </p>
        )}

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
              const application = applicationByDrive.get(drive.drive_id);
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
                    {application ? (
                      <StatusBadge tone={statusTone(application.status)}>
                        {application.status}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="blue">{drive.status}</StatusBadge>
                    )}
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
                        ["Rounds", String(drive.number_of_rounds)],
                        ["Max active backlogs", String(drive.max_active_backlogs)],
                        ["Max passive backlogs", String(drive.max_passive_backlogs)],
                        ["Branches", drive.allowed_branches?.join(", ") || "—"],
                      ]}
                    />

                    <div className="mt-auto flex justify-end pt-2">
                      {application ? (
                        <Button
                          variant="outline"
                          type="button"
                          disabled={withdraw.isPending}
                          onClick={() => withdraw.mutate(application.application_id)}
                        >
                          {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={!studentId || applyForDrive.isPending}
                          onClick={() =>
                            studentId &&
                            applyForDrive.mutate({
                              driveId: drive.drive_id,
                              studentId,
                            })
                          }
                        >
                          {applyForDrive.isPending ? "Applying..." : "Apply"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {(applyForDrive.isError || withdraw.isError) && (
          <p className="text-sm text-destructive">
            {applyForDrive.error?.message ?? withdraw.error?.message}
          </p>
        )}
      </PageContainer>
    </>
  );
}
