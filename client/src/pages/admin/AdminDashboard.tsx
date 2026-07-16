import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileWarning,
  Landmark,
  Megaphone,
  Repeat2,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompanies } from "../../hooks/useCompanies";
import { useDrives } from "../../hooks/useDrives";
import { useStudents } from "../../hooks/useStudents";
import { useAllAdmins, useAllSpcs, useAllTpcs } from "../../hooks/useVerification";
import { computeStudentStats } from "../../lib/studentStats";
import { paths } from "../../routes/paths";

const quickLinks = [
  { label: "Manage companies", to: paths.adminCompanies, icon: Building2 },
  { label: "Manage drives", to: paths.adminDrives, icon: Megaphone },
  { label: "Browse students", to: paths.adminStudents, icon: Users },
  { label: "TPCs", to: paths.adminTpcs, icon: Landmark },
  { label: "SPCs", to: paths.adminSpcs, icon: UserCog },
  { label: "Admins", to: paths.adminAdmins, icon: ShieldCheck },
  { label: "Announcements", to: paths.adminPosts, icon: ClipboardList },
  { label: "Invite TPC / SPC / Admin", to: paths.adminInvitations, icon: UserPlus },
];

/**
 * Purpose: /Admin - UPC/Admin overview combining GET /students and GET
 * /companies (each through their own TanStack Query hook), giving a
 * snapshot of the placement cell's overall numbers before drilling into
 * Companies/Drives/Students.
 */
export default function AdminDashboard() {
  const students = useStudents();
  const companies = useCompanies();
  const drives = useDrives();
  const spcs = useAllSpcs();
  const tpcs = useAllTpcs();
  const admins = useAllAdmins();

  /**
   * Placement/verification breakdowns, all derived from the one students list:
   * - placed counts both 'placed' and 'second_chance' (a second-chance student
   *   is still a placed student, just via a 2x offer).
   * - awaiting TPC = SPC approved ('spc_verified'); awaiting SPC = 'pending'.
   * - incomplete = registered a profile but is_profile_complete is still false.
   */
  const stats = useMemo(() => computeStudentStats(students.data), [students.data]);

  const isLoading = students.isLoading || companies.isLoading || drives.isLoading;
  const isError = students.isError || companies.isError;

  if (isLoading) {
    return (
      <>
        <Topbar title="Placement cell overview" subtitle="Companies, drives, and student placement at a glance." />
        <PageContainer>
          <LoadingState label="Loading overview..." />
        </PageContainer>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Topbar title="Placement cell overview" subtitle="" />
        <PageContainer>
          <ErrorState
            message={students.error?.message ?? companies.error?.message ?? "Could not load the overview."}
            onRetry={() => {
              students.refetch();
              companies.refetch();
            }}
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Topbar title="Placement cell overview" subtitle="Companies, drives, and student placement at a glance." />
      <PageContainer>


        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
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
        Quick Stats
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Companies"
            value={String(companies.data?.length ?? 0)}
            note="Engaged with the placement cell"
            icon={<Building2 />}
          />
          <StatCard
            label="Drives"
            value={String(drives.data?.length ?? 0)}
            note="Announced so far"
            icon={<Megaphone />}
          />
          <StatCard
            label="Students"
            value={String(students.data?.length ?? 0)}
            note="Registered in the portal"
            icon={<Users />}
          />
          <StatCard
            label="Placed"
            value={String(stats.placed)}
            note="Students placed via drives"
            icon={<Award />}
          />
          <StatCard
            label="Second chances"
            value={String(stats.secondChances)}
            note="Placed again via a 2x offer"
            icon={<Repeat2 />}
          />
          <StatCard
            label="Internship selections"
            value={String(stats.interns)}
            note="Selected for internships"
            icon={<Briefcase />}
          />
          <StatCard
            label="Fully verified"
            value={String(stats.verified)}
            note="Cleared SPC + TPC review"
            icon={<BadgeCheck />}
          />
          <StatCard
            label="Awaiting TPC review"
            value={String(stats.awaitingTpc)}
            note="SPC-approved, pending final TPC sign-off"
            icon={<ClipboardCheck />}
          />
          <StatCard
            label="Awaiting SPC review"
            value={String(stats.awaitingSpc)}
            note="Profiles pending SPC verification"
            icon={<ClipboardList />}
          />
          <StatCard
            label="Incomplete profiles"
            value={String(stats.incomplete)}
            note="Registered but profile not finished"
            icon={<FileWarning />}
          />
          <StatCard
            label="SPCs"
            value={String(spcs.data?.length ?? 0)}
            note="Student placement coordinators"
            icon={<UserCog />}
          />
          <StatCard
            label="TPCs"
            value={String(tpcs.data?.length ?? 0)}
            note="Department placement coordinators"
            icon={<Landmark />}
          />
          <StatCard
            label="Admins"
            value={String(admins.data?.length ?? 0)}
            note="Placement cell admin accounts"
            icon={<ShieldCheck />}
          />
        </div>
      </PageContainer>
    </>
  );
}
