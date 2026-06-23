import { useMutation, useQuery } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  completeRegistration,
  sendInvitation,
  verifyInvitation,
  type CompleteRegistrationPayload,
  type InvitationDetails,
  type SendInvitationPayload,
  type SendInvitationResponse,
} from "../services/invitationService";

// Purpose: TanStack Query wrappers over invitationService.ts. None of these share a list cache (the backend has no "list invitations" endpoint), so they're plain mutations plus a single-token verification query.

/** Purpose: POST /invite/invite - Admin invites a TPC/Admin/SPC by email. */
export function useSendInvitation() {
  return useMutation<SendInvitationResponse, ApiError, SendInvitationPayload>({
    mutationFn: sendInvitation,
  });
}

/** Purpose: GET /invite/verify/:token - validate the invite link before showing the registration form. retry:false because an invalid/expired token is a real answer, not a transient failure; enabled only once a token is present. */
export function useVerifyInvitation(token: string | undefined) {
  return useQuery<InvitationDetails, ApiError>({
    queryKey: ["invitation", "verify", token ?? "none"],
    queryFn: () => verifyInvitation(token as string),
    enabled: !!token,
    retry: false,
  });
}

/** Purpose: POST /invite/complete/:token - the invited user finishes their registration. */
export function useCompleteRegistration() {
  return useMutation<
    { message: string },
    ApiError,
    { token: string; payload: CompleteRegistrationPayload }
  >({
    mutationFn: ({ token, payload }) => completeRegistration(token, payload),
  });
}