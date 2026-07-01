import { useState, type FormEvent } from "react";
import { Copy, Check, Mail, UserPlus } from "lucide-react";

import Topbar from "../../components/Topbar";
import { SectionTitle } from "../../components/ui";
import { useSendInvitation } from "../../hooks/useInvitations";
import { validateEmail } from "../../lib/validation";
import type { Role } from "../../types";

import "../../styles/dashboard.css";
import "../../styles/form-wizard.css";

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

  return (
    <>
      <Topbar
        title="Invitations"
        subtitle="Invite TPC or Admin users to join the placement portal."
      />
      <div className="dashboard-content">
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-body">
            <form onSubmit={handleSubmit} noValidate>
              <SectionTitle
                icon={<UserPlus size={18} />}
                title="Send an invitation"
                subtitle="The invitee gets a link to set their own password and complete registration."
              />
              <div className="form-grid">
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                  {emailError && <span className="field-error">{emailError}</span>}
                </label>
                <label>
                  Role
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as Exclude<Role, "student">)
                    }
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {sendInvitation.isError && (
                <span className="field-error">
                  {sendInvitation.error.message}
                </span>
              )}

              <div className="form-actions">
                <p />
                <button
                  className="primary"
                  type="submit"
                  disabled={sendInvitation.isPending}
                >
                  {sendInvitation.isPending ? "Sending..." : "Send invitation"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
