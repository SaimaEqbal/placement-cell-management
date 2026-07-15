import { useState, type FormEvent } from "react";
import { ArrowRight, MailCheck } from "lucide-react";

import { AuthShell, AuthBackLink } from "@/components/auth/AuthShell";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { AuthField, PasswordField } from "@/components/auth/AuthFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResendVerification, useSignup } from "../../hooks/useAuthMutations";
import { validateConfirmPassword, validateInstitutionalEmail, validatePassword, } from "../../lib/validation";
import { paths } from "../../routes/paths";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** Purpose: /register - create the student account via POST /auth/signup. */
export default function RegistrationPage() {
  const signupMutation = useSignup();
  /** Lets the "Check your inbox" screen re-send the verification email without making the student go back to the login page to do it. */
  const resendMutation = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Purpose: validate the credential fields, then call POST /auth/signup (email + password only). */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      email: validateInstitutionalEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    /** Email is lowercased here so the account is created with the same canonical form the user will log in with (emails are case-insensitive). */
    signupMutation.mutate({ email: email.trim().toLowerCase(), password });
  }

  if (signupMutation.isSuccess) {
    return (
      <AuthShell>
        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            <AuthStatus
              tone="success"
              icon={<MailCheck />}
              title="Check your inbox"
              description={
                <>
                  We sent a verification link to{" "}
                  <span className="font-medium text-foreground">
                    {email.trim().toLowerCase()}
                  </span>
                  . Open it to activate your account, then come back and sign in.
                </>
              }
            />

            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
              <p>
                Didn't receive the email?{" "}
                <button
                  type="button"
                  disabled={resendMutation.isPending}
                  onClick={() =>
                    resendMutation.mutate(email.trim().toLowerCase())
                  }
                  className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
                >
                  {resendMutation.isPending ? "Resending..." : "Resend it"}
                  <ArrowRight className="size-3.5" />
                </button>
              </p>
              {resendMutation.isSuccess && (
                <p>Verification email sent — check your inbox.</p>
              )}
              {resendMutation.isError && (
                <p className="text-destructive">
                  {resendMutation.error.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t pt-6">
            <AuthBackLink to={paths.login}>
              Back to sign in <ArrowRight className="size-4" />
            </AuthBackLink>
          </CardFooter>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create your student account</CardTitle>
          <CardDescription>
            Just your login details for now — you'll complete your academic
            profile after your first login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <AuthField
              id="email"
              label="Institutional email"
              error={errors.email}
            >
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </AuthField>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="new-password"
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            {signupMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {signupMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Creating account..." : "Create account"}
              <ArrowRight />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your information is securely stored.
            </p>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
          <AuthBackLink to={paths.login}>Back to sign in</AuthBackLink>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
