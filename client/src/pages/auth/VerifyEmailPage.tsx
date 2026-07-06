import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Link2Off, Loader2 } from "lucide-react";

import { AuthShell, AuthBackLink } from "@/components/auth/AuthShell";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useVerifyEmail } from "../../hooks/useAuthMutations";
import { paths } from "../../routes/paths";

/** Purpose: /verify-email - confirm the link from the verification email(GET /auth/verify-email?token=...) and report success/failure.*/
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const verifyMutation = useVerifyEmail();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current || !token) return;
    hasRunRef.current = true;
    verifyMutation.mutate(token);
    /** verifyMutation is stable (TanStack Query) - only `token` should re-run this. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell>
      <Card>
        <CardContent className="pt-6">
          {!token && (
            <AuthStatus
              tone="error"
              icon={<Link2Off />}
              title="Missing verification link"
              description="This page needs the link from your verification email — please open it directly from your inbox."
            />
          )}

          {token && verifyMutation.isPending && (
            <AuthStatus
              icon={<Loader2 className="animate-spin" />}
              title="Verifying your email..."
              description="This will only take a moment."
            />
          )}

          {token && verifyMutation.isSuccess && (
            <AuthStatus
              tone="success"
              icon={<CheckCircle2 />}
              title="Email verified"
              description={`${verifyMutation.data.message} You can now sign in.`}
            />
          )}

          {token && verifyMutation.isError && (
            <AuthStatus
              tone="error"
              icon={<Link2Off />}
              title="Verification failed"
              description={verifyMutation.error.message}
            />
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <AuthBackLink to={paths.login}>Back to sign in</AuthBackLink>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
