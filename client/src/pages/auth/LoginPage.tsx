import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, PasswordField } from "@/components/auth/AuthFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../context/AuthContext";
import { useLogin, useResendVerification } from "../../hooks/useAuthMutations";
import { decodeAccessToken } from "../../lib/jwt";
import { validateEmail } from "../../lib/validation";
import { homePathForRole, paths } from "../../routes/paths";
import type { Role } from "../../types";

/** Purpose: /login - authenticate against POST /auth/login and route the student/SPC/TPC/admin to their own dashboard. */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const resendMutation = useResendVerification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  /** Purpose: client-side check, then POST /auth/login; on success store the token and route by the role it decodes to. */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setFormError(emailError);
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }
    setFormError(undefined);

    loginMutation.mutate(
      /** Email lowercased to match the canonical form stored at signup - addresses are case-insensitive, but the DB lookup is not. */
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: (data) => {
          login(data.token);
          const decoded = decodeAccessToken(data.token);
          navigate(homePathForRole((decoded?.role as Role) ?? null), {
            replace: true,
          });
        },
      },
    );
  }

  const isUnverified = loginMutation.error?.status === 403;

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to your portal</CardTitle>
          <CardDescription>Enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <AuthField id="email" label="Email">
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
              autoComplete="current-password"
            />

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {!formError && loginMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col gap-2">
                  <span>{loginMutation.error.message}</span>
                  {isUnverified && (
                    <button
                      type="button"
                      disabled={resendMutation.isPending}
                      onClick={() =>
                        resendMutation.mutate(email.trim().toLowerCase())
                      }
                      className="inline-flex w-fit items-center gap-1 font-medium underline underline-offset-4 disabled:opacity-50"
                    >
                      Resend verification email <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {resendMutation.isSuccess && (
              <p className="text-sm text-muted-foreground">
                Verification email sent — check your inbox.
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            Forgot your password?{" "}
            <Link
              to={paths.forgotPassword}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Reset it
            </Link>
          </p>
          <p>
            New student?{" "}
            <Link
              to={paths.register}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create your profile
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
