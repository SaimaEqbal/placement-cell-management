import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Topbar from "../Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { DriveStatusView } from "@/components/dashboard/DriveStatusView";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrive, useDriveStudents } from "../../hooks/useDrives";

/**
 * Purpose: read-only "view status" page for a single drive, shared by the SPC and
 * TPC roles. It reuses the DriveStatusView (drive summary + shared round-history
 * viewer + current-round summary) so these roles observe a drive's progress with
 * exactly the same round-results display as the admin drive page, minus every
 * management control.
 */
export function DriveStatusPage({ backPath }: { backPath: string }) {
  const { driveId } = useParams<{ driveId: string }>();
  const id = driveId ?? "";

  const drive = useDrive(driveId);
  const { data: companies } = useCompanies();
  const students = useDriveStudents(driveId);

  const companyName = drive.data
    ? companies?.find((c) => c.company_id === drive.data!.company_id)?.company_name
    : undefined;

  const title = drive.data?.job_role || companyName || "Drive";
  const subtitle = companyName ? `${companyName} · drive status` : "Drive status";

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <PageContainer>
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={backPath}>
              <ArrowLeft /> Back to drives
            </Link>
          </Button>
        </div>

        {drive.isLoading && <LoadingState label="Loading drive..." />}
        {drive.isError && (
          <ErrorState
            message={drive.error?.message ?? "Could not load the drive."}
            onRetry={drive.refetch}
          />
        )}

        {drive.data && (
          <DriveStatusView
            driveId={id}
            drive={drive.data}
            companyName={companyName}
            students={students.data ?? []}
          />
        )}
      </PageContainer>
    </>
  );
}
