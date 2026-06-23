import { axiosInstance } from "../api/axiosInstance";
import type { Role } from "../types";

// Purpose: every Axios call for the invitation + invite-registration flow
// (server/src/routes/invitationRoutes.js -> invitationController.js): an Admin
// invites a TPC/Admin/SPC by email, the invitee opens the emailed link, and
// completes their own registration. sendInvitation is auth'd (Admin only);
// verify/complete are public so a logged-out invitee can use them.

/** Body accepted by POST /invite/invite. */
export interface SendInvitationPayload {
  email: string;
  role: Exclude<Role, "student">;
}

/** Response from POST /invite/invite. Email isn't delivered server-side yet, so the link is returned for the Admin to share. */
export interface SendInvitationResponse {
  message: string;
  inviteLink: string;
}

/** Response from GET /invite/verify/:token - the pending invitation's email + role. */
export interface InvitationDetails {
  email: string;
  role: Role;
}

/** Body accepted by POST /invite/complete/:token. */
export interface CompleteRegistrationPayload {
  name: string;
  phone: string;
  branch: string;
  password: string;
}

/** Purpose: POST /invite/invite - create + "send" an invitation (Admin only). */
export function sendInvitation(payload: SendInvitationPayload) {
  return axiosInstance
    .post<SendInvitationResponse>("/invite/invite", payload)
    .then((res) => res.data);
}

/** Purpose: GET /invite/verify/:token - check an invite token and read its email/role (public). */
export function verifyInvitation(token: string) {
  return axiosInstance
    .get<InvitationDetails>(`/invite/verify/${token}`)
    .then((res) => res.data);
}

/** Purpose: POST /invite/complete/:token - finish registration for an invited user (public). */
export function completeRegistration(
  token: string,
  payload: CompleteRegistrationPayload,
) {
  return axiosInstance
    .post<{ message: string }>(`/invite/complete/${token}`, payload)
    .then((res) => res.data);
}
