import { LogOut, Mail, ShieldCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABEL } from "../../lib/roleLabels";

/**
 * Purpose: /TPC/account and /Admin/account - a lightweight "who am I signed in
 * as" page for roles that aren't backed by a student record (so they have
 * nothing like ProfilePage.tsx's documents/academic details to show). Built
 * from useAuth() alone - no extra network request, since email/role/id are
 * already decoded from the JWT on login.
 */
export default function AccountPage() {
  const { user, role, logout } = useAuth();
  const initials = role ? role.slice(0, 2).toUpperCase() : "??";
  const roleLabel = role ? ROLE_LABEL[role] : "Account";

  return (
    <>
      <Topbar title="Account" subtitle="Your sign-in details for this workspace." />
      <PageContainer>
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-lg">{roleLabel}</CardTitle>
                <p className="truncate text-sm text-muted-foreground">
                  {user?.email ?? "No email on file"}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <InfoGrid
                items={[
                  ["Email", user?.email ?? "—"],
                  ["Role", roleLabel],
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                Signed in with {user?.email ?? "your institutional email"}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                Access level: {roleLabel}
              </div>
              <Button
                variant="outline"
                className="mt-2 w-fit"
                type="button"
                onClick={() => logout()}
              >
                <LogOut />
                Log out
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}