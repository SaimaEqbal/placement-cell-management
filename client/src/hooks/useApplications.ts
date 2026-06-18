import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplicationStatus,
  type ApplicationRecord,
} from "../services/applicationService";
import { queryKeys } from "./queryKeys";

// STATUS: TODO, mirrors applicationService.ts - the backend does not mount
// /api/applications yet, so useApplications() resolves to a 404 ApiError
// until it does. Pages should render that as an empty/"coming soon" state
// instead of a scary error - see PlacementDrivesPage.

/** Purpose: GET /applications - list every application. retry:false because a 404 here means "not implemented yet", not a transient failure. */
export function useApplications() {
  return useQuery<ApplicationRecord[], ApiError>({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
    retry: false,
  });
}

/** Purpose: POST /applications - shortlist a student for a company/drive. */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationRecord,
    ApiError,
    { studentId: number; companyId: number }
  >({
    mutationFn: ({ studentId, companyId }) =>
      createApplication(studentId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

/** Purpose: PUT /applications/:id/status - move an application through its workflow. */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationRecord,
    ApiError,
    { id: number | string; status: string }
  >({
    mutationFn: ({ id, status }) => updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

/** Purpose: DELETE /applications/:id - withdraw/remove an application. */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}
