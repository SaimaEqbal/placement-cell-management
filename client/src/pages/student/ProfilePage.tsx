import { Link } from "react-router-dom";
import { Edit3 } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { DocumentPreview } from "@/components/dashboard/DocumentPreview";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "../../hooks/useProfile";
import { capitalize, formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

/**
 * Purpose: /Student/profile - read-only view of the student's own record.
 * Calls the same useProfile() hook (same ['students','me'] query key) as
 * StudentDashboard, so if the dashboard already loaded the profile this
 * page renders instantly from cache instead of firing a second request.
 */
export default function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <>
        <Topbar title="My profile" subtitle="" />
        <PageContainer>
          <LoadingState label="Loading your profile..." />
        </PageContainer>
      </>
    );
  }

  if (isError || !profile) {
    const isIncomplete = error?.status === 404;
    return (
      <>
        <Topbar title="My profile" subtitle="" />
        <PageContainer>
          <ErrorState
            message={
              isIncomplete
                ? "You haven't completed your profile yet."
                : error?.message ?? "Could not load your profile."
            }
            onRetry={isIncomplete ? undefined : refetch}
          />
          {isIncomplete && (
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link to={paths.studentCompleteProfile}>Complete your profile</Link>
              </Button>
            </div>
          )}
        </PageContainer>
      </>
    );
  }

  /** Per-semester SPIs, showing only the semesters the student has filled in. */
  const spiItems: [string, string][] = [
    profile.sem1_spi,
    profile.sem2_spi,
    profile.sem3_spi,
    profile.sem4_spi,
    profile.sem5_spi,
    profile.sem6_spi,
    profile.sem7_spi,
    profile.sem8_spi,
  ].reduce<[string, string][]>((acc, value, i) => {
    if (value != null && value !== "") acc.push([`Semester ${i + 1}`, String(value)]);
    return acc;
  }, []);

  const documents: Array<{ label: string; url: string | null }> = [
    { label: "Resume", url: profile.resume_url },
    { label: "10th marksheet", url: profile.tenth_marksheet_url },
    { label: "12th marksheet", url: profile.twelfth_marksheet_url },
    { label: "Latest semester marksheet", url: profile.last_sem_marksheet_url },
  ];

  return (
    <>
      <Topbar
        title="My profile"
        subtitle={profile.roll_no}
        initials={initialsFromName(profile.name)}
      />
      <PageContainer>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
            <CardTitle className="text-lg">Personal &amp; academic details</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to={paths.studentCompleteProfile}>
                <Edit3 /> Edit
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <InfoGrid
              className="lg:grid-cols-3"
              items={[
                ["Full name", profile.name],
                ["Roll number", profile.roll_no],
                ["Email", profile.email],
                ["Phone", profile.phone ?? "—"],
                ["Department", profile.department ?? "—"],
                ["Branch", profile.branch ?? "—"],
                ["Graduation year", profile.graduation_year ? String(profile.graduation_year) : "—"],
                ["Current semester", profile.semester ? String(profile.semester) : "—"],
                ["CGPA", formatCgpa(profile.cgpa)],
                ["10th percentage", profile.tenth_percentage ?? "—"],
                ["12th percentage", profile.twelfth_percentage ?? "—"],
                ["Gender", profile.gender ?? "—"],
                ["Region", profile.region ?? "—"],
                ["Religion", profile.religion ?? "—"],
                ["Date of birth", formatDate(profile.date_of_birth)],
                ["Active backlogs", String(profile.active_backlogs)],
                ["Passive backlogs", String(profile.passive_backlogs)],
                ["Placement status", capitalize(profile.placement_status)],
                ["Verification status", capitalize(profile.review_status ?? "pending")],
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Documents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            {documents.map((doc) => (
              <DocumentPreview key={doc.label} label={doc.label} url={doc.url} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Semester SPIs</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {spiItems.length > 0 ? (
              <InfoGrid className="lg:grid-cols-4" items={spiItems} />
            ) : (
              <p className="text-sm text-muted-foreground">No SPIs recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
