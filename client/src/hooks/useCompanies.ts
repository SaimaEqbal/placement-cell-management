import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import { createCompany, deleteCompany, getCompanies, getCompanyById, updateCompany, type CompanyRecord, type CreateCompanyPayload, type UpdateCompanyPayload} from "../services/companyService";
import { queryKeys } from "./queryKeys";

/** Purpose: GET /companies - list companies/placement drives. Shared cache entry for the student Placement Drives page and the Admin Companies/Drives pages. */
export function useCompanies() {
  return useQuery<CompanyRecord[], ApiError>({
    queryKey: queryKeys.companies,
    queryFn: getCompanies,
  });
}

/** Purpose: GET /companies/:id - a single company's full detail. */
export function useCompany(id: number | string | undefined) {
  return useQuery<CompanyRecord, ApiError>({
    queryKey: queryKeys.company(id ?? "unknown"),
    queryFn: () => getCompanyById(id as number | string),
    enabled: id !== undefined,
  });
}

/** Purpose: POST /companies - add a company/drive (UPC/Admin or TPC). Invalidates the companies list on success. */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation<CompanyRecord, ApiError, CreateCompanyPayload>({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
  });
}

/** Purpose: PUT /companies/:id - edit a company/drive. Invalidates the list and that company's detail cache. */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyRecord,
    ApiError,
    { id: number | string; payload: UpdateCompanyPayload }
  >({
    mutationFn: ({ id, payload }) => updateCompany(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
      queryClient.invalidateQueries({ queryKey: queryKeys.company(variables.id) });
    },
  });
}

/** Purpose: DELETE /companies/:id - remove a company/drive. Invalidates the companies list. */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies });
    },
  });
}