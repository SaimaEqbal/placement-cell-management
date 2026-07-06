import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  UserCog,
  Users,
  XCircle,
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
import { useTpcQueue, useTpcSpcVerified, useTpcStudents } from "../../hooks/useVerification";
import { paths } from "../../routes/paths";

const quickLinks = [
  { label: "Verification queue", to: paths.tpcVerification, icon: ClipboardCheck },
  { label: "Awaiting TPC verification", to: paths.tpcSpcVerified, icon: CheckCircle2 },
  { label: "Students", to: paths.tpcStudents, icon: Users },
  { label: "SPC assignment", to: paths.tpcSpc, icon: UserCog },
];

/**
 * Purpose: /TPC - overview for the Training & Placement Coordinator, scoped to
 * their own department: how many students are awaiting their final review, how
 * many the SPC bounced back, and the department total. Links into each section.
 */
export default function TpcDashboard() {
  const students = useTpcStudents();
  const queue = useTpcQueue();
  const awaiting = useTpcSpcVerified();

  if (students.isLoading) {
    return (
      <>
        <Topbar title="TPC overview" subtitle="Your department's verification pipeline." />
        <PageContainer>
          <LoadingState label="Loading your department..." />
        </PageContainer>
      </>
    );
  }

  if (students.isError) {
    return (
      <>
        <Topbar title="TPC overview" subtitle="" />
        <PageContainer>
          <ErrorState
            message={students.error?.message ?? "Could not load your department."}
            onRetry={students.refetch}
          />
        </PageContainer>
      </>
    );
  }

  const total = students.data?.length ?? 0;
  const rejectedCount = queue.data?.length ?? 0;
  const awaitingCount = awaiting.data?.length ?? 0;

  return (
    <>
      <Topbar title="TPC overview" subtitle="Your department's verification pipeline." />
      <PageContainer>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Awaiting TPC review"
            value={String(awaitingCount)}
            note="SPC-verified + coordinators"
            icon={<CheckCircle2 />}
          />
          <StatCard
            label="Rejected by SPC"
            value={String(rejectedCount)}
            note="In your verification queue"
            icon={<XCircle />}
          />
          <StatCard
            label="Department students"
            value={String(total)}
            note="Total in your department"
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
