import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, MailCheck } from "lucide-react";

import { AuthShell, AuthBackLink } from "@/components/auth/AuthShell";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { AuthField } from "@/components/auth/AuthFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "../../hooks/useAuthMutations";
import { validateEmail } from "../../lib/validation";
import { paths } from "../../routes/paths";

/** Purpose: /forgot-password - request a reset link via POST /auth/forgot-password. */
export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(undefined);
    /** Lowercased to match the canonical form stored at signup - the backend
     * lookup is case-sensitive, so a mixed-case entry would silently find nothing. */
    forgotMutation.mutate(email.trim().toLowerCase());
  }

  return (
    <AuthShell>
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          {forgotMutation.isSuccess ? (
            <AuthStatus
              tone="success"
              icon={<MailCheck />}
              title="Check your inbox"
              description={forgotMutation.data.message}
            />
          ) : (
            <>
              <AuthStatus
                icon={<KeyRound />}
                title="Forgot your password?"
                description="Enter your account email and we'll send you a reset link."
              />

              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-4"
              >
                <AuthField id="email" label="Email" error={fieldError}>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                  />
                </AuthField>

                {forgotMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {forgotMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? "Sending..." : "Send reset link"}
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
