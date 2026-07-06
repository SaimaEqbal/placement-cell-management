import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  FileText,
  GaugeCircle,
  GraduationCap,
  Megaphone,
  UserPen,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "../../hooks/useProfile";
import { capitalize, formatCgpa, initialsFromName } from "../../lib/format";
import { computeProfileCompletion } from "../../lib/profileCompletion";
import { paths } from "../../routes/paths";

const quickLinks = [
  { label: "View full profile", to: paths.studentProfile, icon: FileText },
  { label: "Browse placement drives", to: paths.studentDrives, icon: Briefcase },
  { label: "Announcements", to: paths.studentAnnouncements, icon: Megaphone },
  { label: "Edit my profile", to: paths.studentCompleteProfile, icon: UserPen },
];

/**
 * Purpose: /Student - the student's own overview. Fetches GET /students/me
 * exclusively through useProfile() (studentService -> useProfile ->
 * TanStack Query); this component never imports axios, per project rules.
 * Displays exactly the fields the brief calls for: Name, Roll Number,
 * Branch, CGPA, Placement Status, Profile Completion Percentage.
 */
export default function StudentDashboard() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  /** A 404 from GET /students/me means "hasn't completed their profile yet" - route that to a call-to-action, not a scary error screen. */
  const profileIncomplete = error?.status === 404;

  if (isLoading) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="Loading your profile..." />
        <PageContainer>
          <LoadingState label="Loading your profile..." />
        </PageContainer>
      </>
    );
  }

  if (profileIncomplete) {
    return (
      <>
        <Topbar title="Welcome" subtitle="Let's finish setting up your profile" />
        <PageContainer>
          <EmptyState
            icon={<FileText />}
            title="Your profile isn't complete yet"
            description="Add your academic details and documents so the placement cell can review you."
          />
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link to={paths.studentCompleteProfile}>
                Complete your profile <ArrowRight />
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  if (isError || !profile) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="" />
        <PageContainer>
          <ErrorState
            message={error?.message ?? "Could not load your profile."}
            onRetry={refetch}
          />
        </PageContainer>
      </>
    );
  }

  const completion = computeProfileCompletion(profile);
  const initials = initialsFromName(profile.name);
  const firstName = profile.name.split(" ")[0] || profile.name;

  return (
    <>
      <Topbar title={`Welcome, ${firstName}`} subtitle="" initials={initials} />
      <PageContainer>
        {!profile.is_profile_complete && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">Your profile isn't complete</div>
                <div className="text-sm text-muted-foreground">
                  Finish it so the placement cell can review you.
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link to={paths.studentCompleteProfile}>
                  Complete your profile <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Profile completion"
            value={`${completion}%`}
            note="of your profile filled in"
            icon={<GaugeCircle />}
          />
          <StatCard
            label="CGPA"
            value={formatCgpa(profile.cgpa)}
            note={`Branch: ${profile.branch ?? "not set"}`}
            icon={<GraduationCap />}
          />
          <StatCard
            label="Placement status"
            value={capitalize(profile.placement_status)}
            note={`Roll no ${profile.roll_no}`}
            icon={<Briefcase />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge
                tone={profile.review_status === "verified" ? "green" : "amber"}
              >
                {capitalize(profile.review_status ?? "pending")}
              </StatusBadge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickLinks.map(({ label, to, icon: Icon }) => (
                <Button
                  key={to}
                  asChild
                  variant="outline"
                  className="h-auto justify-between px-4 py-3"
                >
                  <Link to={to}>
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
