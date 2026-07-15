import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, KeyRound, Link2Off } from "lucide-react";

import { AuthShell, AuthBackLink } from "@/components/auth/AuthShell";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { PasswordField } from "@/components/auth/AuthFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useResetPassword } from "../../hooks/useAuthMutations";
import { validateConfirmPassword, validatePassword } from "../../lib/validation";
import { paths } from "../../routes/paths";

/** Purpose: /reset-password - set a new password via POST /auth/reset-password, using the token from the reset email. */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetMutation = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    const nextErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword) return;

    resetMutation.mutate({ token, password });
  }

  if (!token) {
    return (
      <AuthShell>
        <Card>
          <CardContent className="pt-6">
            <AuthStatus
              tone="error"
              icon={<Link2Off />}
              title="Missing reset link"
              description="This page needs the link from your password-reset email — please open it directly from your inbox, or request a new one."
            />
          </CardContent>
          <CardFooter className="justify-center border-t pt-6">
            <AuthBackLink to={paths.forgotPassword}>
              Request a new link
            </AuthBackLink>
          </CardFooter>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          {resetMutation.isSuccess ? (
            <AuthStatus
              tone="success"
              icon={<CheckCircle2 />}
              title="Password updated"
              description={`${resetMutation.data.message} You can now sign in.`}
            />
          ) : (
            <>
              <AuthStatus
                icon={<KeyRound />}
                title="Choose a new password"
                description="This link expires 15 minutes after it was sent."
              />

              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-4"
              >
                <PasswordField
                  id="password"
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {resetMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {resetMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? "Updating..." : "Update password"}
                  <ArrowRight />
                </Button>
              </form>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <AuthBackLink to={paths.login}>Back to sign in</AuthBackLink>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
