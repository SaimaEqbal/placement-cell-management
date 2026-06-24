import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Link2Off, Loader2 } from "lucide-react";

import Brand from "../../components/Brand";
import { useVerifyEmail } from "../../hooks/useAuthMutations";
import { paths } from "../../routes/paths";

import "../../styles/auth-status.css";

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
    // verifyMutation is stable (TanStack Query) - only `token` should re-run this. eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand compact />

        {!token && (
          <>
            <div className="auth-status-icon error">
              <Link2Off size={26} />
            </div>
            <h2>Missing verification link</h2>
            <p className="muted">
              This page needs the link from your verification email - please open it directly from your inbox.
            </p>
          </>
        )}

        {token && verifyMutation.isPending && (
          <>
            <div className="auth-status-icon pending">
              <Loader2 size={26} className="spin" />
            </div>
            <h2>Verifying your email...</h2>
            <p className="muted">This will only take a moment.</p>
          </>
        )}

        {token && verifyMutation.isSuccess && (
          <>
            <div className="auth-status-icon success">
              <CheckCircle2 size={26} />
            </div>
            <h2>Email verified</h2>
            <p className="muted">{verifyMutation.data.message} You can now sign in.</p>
          </>
        )}

        {token && verifyMutation.isError && (
          <>
            <div className="auth-status-icon error">
              <Link2Off size={26} />
            </div>
            <h2>Verification failed</h2>
            <p className="muted">{verifyMutation.error.message}</p>
          </>
        )}

        <div className="back-link">
          <Link className="text-btn" to={paths.login}>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}