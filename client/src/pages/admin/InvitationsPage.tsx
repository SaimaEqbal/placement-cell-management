import { useState, type FormEvent } from "react";
import { Copy, Check, Mail, UserPlus } from "lucide-react";

import Topbar from "../../components/Topbar";
import { SectionTitle } from "../../components/ui";
import { useSendInvitation } from "../../hooks/useInvitations";
import { validateEmail } from "../../lib/validation";
import type { Role } from "../../types";

import "../../styles/dashboard.css";
import "../../styles/form-wizard.css";

/** Roles an Admin can invite (everyone except plain students, who self-register). */
const INVITABLE_ROLES: { value: Exclude<Role, "student">; label: string }[] = [
  { value: "tpc", label: "TPC - Training & Placement Cell" },
  { value: "spc", label: "SPC - Student Placement Coordinator" },
  { value: "admin", label: "Admin" },
];

/**
 * Purpose: /Admin/invitations - the Admin "invite a TPC/Admin/SPC" screen.
 * POSTs to /invite/invite (useSendInvitation). The backend does not actually
 * deliver the email yet (invitationController.js has a "// send email here"
 * placeholder) but returns the invite link in its response, so we display it
 * with a copy button for the Admin to share manually.
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
      // Clipboard may be unavailable (e.g. non-secure context); the link is
      // still visible on screen for manual copying.
      setCopied(false);
    }
  }

  return (
    <>
      <Topbar
        title="Invitations"
        subtitle="Invite TPC, SPC, or Admin users to join the placement portal."
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

        {sendInvitation.isSuccess && sendInvitation.data && (
          <section className="panel">
            <div className="panel-head">
              <h2>Invitation created</h2>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                <Mail size={13} /> Email delivery isn't wired up yet - copy this
                link and send it to the invitee. It expires in 7 days.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  readOnly
                  value={sendInvitation.data.inviteLink}
                  style={{
                    flex: 1,
                    minWidth: 260,
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                  }}
                />
                <button
                  className="secondary"
                  type="button"
                  onClick={() => copyLink(sendInvitation.data!.inviteLink)}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
