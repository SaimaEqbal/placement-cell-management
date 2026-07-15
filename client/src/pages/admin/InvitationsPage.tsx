import { useState, type FormEvent } from "react";
import { Check, Copy, Mail, UserPlus } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { FormSection } from "@/components/dashboard/FormSection";
import { Field } from "@/components/dashboard/Field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSendInvitation } from "../../hooks/useInvitations";
import { validateEmail } from "../../lib/validation";
import type { Role } from "../../types";

/**
 * Roles an Admin can invite by email. SPC is intentionally excluded - SPCs are
 * created by promoting an existing student (a TPC action), and the invite
 * completion flow only provisions TPC/Admin accounts.
 */
const INVITABLE_ROLES: { value: Exclude<Role, "student">; label: string }[] = [
  { value: "tpc", label: "Teacher Placement Co-ordinator" },
  { value: "admin", label: "Admin" },
];

/**
 * Purpose: /Admin/invitations - the Admin "invite a TPC/Admin" screen. POSTs to
 * /invite/invite (useSendInvitation), which emails the invite link to the
 * recipient. The link is also shown with a copy button as a fallback (and for
 * when email delivery isn't configured).
 */
export default function InvitationsPage() {
  const sendInvitation = useSendInvitation();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "student">>("tpc");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setCopied(false);
    sendInvitation.mutate({ email: email.trim().toLowerCase(), role });
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      /** Clipboard may be unavailable (e.g. non-secure context); the link is still visible on screen for manual copying. */
      setCopied(false);
    }
  }

  const result = sendInvitation.data;

  return (
    <>
      <Topbar
        title="Invitations"
        subtitle="Invite TPC or Admin users to join the placement portal."
      />
      <PageContainer className="max-w-3xl">
        <form onSubmit={handleSubmit} noValidate>
          <FormSection
            icon={<UserPlus />}
            title="Send an invitation"
            subtitle="The invitee gets a link to set their own password and complete registration."
          >
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="invite-email" error={emailError}>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </Field>
                <Field label="Role" htmlFor="invite-role">
                  <Select
                    value={role}
                    onValueChange={(value) =>
                      setRole(value as Exclude<Role, "student">)
                    }
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVITABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {sendInvitation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {sendInvitation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert>
                  <Mail />
                  <AlertDescription className="flex flex-col gap-3">
                    <span>
                      {result.emailSent
                        ? `Invitation emailed to ${email}. You can also share the link below.`
                        : `Invitation created. Email delivery isn't configured, so share this link with ${email}:`}
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                        {result.inviteLink}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => copyLink(result.inviteLink)}
                      >
                        {copied ? <Check /> : <Copy />}
                        {copied ? "Copied" : "Copy link"}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={sendInvitation.isPending}>
                  {sendInvitation.isPending ? "Sending..." : "Send invitation"}
                </Button>
              </div>
            </div>
          </FormSection>
        </form>
      </PageContainer>
    </>
  );
}
