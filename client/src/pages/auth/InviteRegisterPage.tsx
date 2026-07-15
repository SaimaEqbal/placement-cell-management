import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, ShieldX } from "lucide-react";

import { AuthShell, AuthBackLink } from "@/components/auth/AuthShell";
import { AuthStatus } from "@/components/auth/AuthStatus";
import { AuthField, PasswordField } from "@/components/auth/AuthFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompleteRegistration, useVerifyInvitation } from "../../hooks/useInvitations";
import { DEPARTMENT_BRANCHES, DEPARTMENT_OPTIONS, validateConfirmPassword, validateDepartment, validateFullName, validatePassword, validatePhone } from "../../lib/validation";
import { paths } from "../../routes/paths";

interface FieldErrors { name?: string; phone?: string; department?: string; password?: string; confirmPassword?: string; }

/** Purpose: /register/:token - the invite-acceptance page. Verifies the token (GET /invite/verify/:token), shows the invited email + role read-only, and lets the invitee set their name/phone/branch/password to finish registration (POST /invite/complete/:token). The backend returns no token on completion, so on success we send them to /login to sign in normally.*/
export default function InviteRegisterPage() {
  const { token } = useParams<{ token: string }>();
  const verify = useVerifyInvitation(token);
  const complete = useCompleteRegistration();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    const nextErrors: FieldErrors = {
      name: validateFullName(name),
      phone: validatePhone(phone),
      department: validateDepartment(department),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    complete.mutate({
      token,
      /** branch is optional (tpc.branch is nullable) - omit it when left blank
       * so the backend stores NULL rather than an empty string. */
      payload: { name: name.trim(), phone: phone.trim(), department, branch: branch || undefined, password },
    });
  }

  if (verify.isLoading) {
    return (
      <AuthShell>
        <Card>
          <CardContent className="pt-6">
            <AuthStatus
              icon={<Loader2 className="animate-spin" />}
              title="Checking your invitation..."
              description="This will only take a moment."
            />
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (verify.isError || !verify.data) {
    return (
      <AuthShell>
        <Card>
          <CardContent className="pt-6">
            <AuthStatus
              tone="error"
              icon={<ShieldX />}
              title="Invitation not valid"
              description="This invitation link is invalid or has expired. Ask your administrator to send a new one."
            />
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

  if (complete.isSuccess) {
    return (
      <AuthShell>
        <Card>
          <CardContent className="pt-6">
            <AuthStatus
              tone="success"
              icon={<CheckCircle2 />}
              title="You're all set"
              description={
                <>
                  Your account has been created. Sign in with{" "}
                  <span className="font-medium text-foreground">
                    {verify.data.email}
                  </span>{" "}
                  and the password you just chose.
                </>
              }
            />
          </CardContent>
          <CardFooter className="justify-center border-t pt-6">
            <AuthBackLink to={paths.login}>
              Go to sign in <ArrowRight className="size-4" />
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
          <CardTitle className="text-2xl">Complete your registration</CardTitle>
          <CardDescription>
            You were invited as{" "}
            <span className="font-medium text-foreground">
              {verify.data.role.toUpperCase()}
            </span>{" "}
            using{" "}
            <span className="font-medium text-foreground">
              {verify.data.email}
            </span>
            . Set your details below to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            className="flex flex-col gap-4"
          >
            <AuthField id="name" label="Full name" error={errors.name}>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </AuthField>

            <AuthField id="phone" label="Phone" error={errors.phone}>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </AuthField>

            <AuthField
              id="department"
              label="Department"
              error={errors.department}
            >
              <Select
                value={department}
                onValueChange={(value) => {
                  setDepartment(value);
                  /** Changing the department clears the branch - the old branch may not belong to the new department. */
                  setBranch("");
                }}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select your department..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AuthField>

            {department && (
              <AuthField id="branch" label="Branch (optional)">
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select your branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEPARTMENT_BRANCHES[department] ?? []).map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AuthField>
            )}

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

            {complete.isError && (
              <Alert variant="destructive">
                <AlertDescription>{complete.error.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={complete.isPending}
            >
              {complete.isPending
                ? "Creating account..."
                : "Complete registration"}
              <ArrowRight />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your information is securely stored.
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
