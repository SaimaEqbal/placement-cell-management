import { Link } from "react-router-dom";
import { ArrowRight, Building2, Megaphone, UserPlus, Users } from "lucide-react";

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
import { paths } from "../../routes/paths";

const quickLinks = [
  { label: "Manage companies", to: paths.adminCompanies, icon: Building2 },
  { label: "Manage drives", to: paths.adminDrives, icon: Megaphone },
  { label: "Filter & shortlist students", to: paths.adminStudents, icon: Users },
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
        <div className="grid gap-4 sm:grid-cols-3">
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
        </div>

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
      </PageContainer>
    </>
  );
}
