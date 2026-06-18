import { axiosInstance } from "../api/axiosInstance";

// Purpose: every Axios call for the `companies` resource - listing companies for the Placement Drives page, and the UPC/Admin company-management CRUD lives here.

/** Shape of a row from the `companies` table (server/src/migrations/002_create_companies.sql). */
export interface CompanyRecord {
  company_id: number;
  company_name: string;
  industry: string | null;
  description: string | null;
  hr_name: string | null;
  hr_email: string | null;
  hr_phone: string | null;
  created_by: string | null;
  created_at: string;
}

/** Body accepted by POST /companies (createCompanySchema). */
export interface CreateCompanyPayload {
  company_name: string;
  industry: string;
  description: string;
  hr_name?: string;
  hr_email?: string;
  hr_phone?: string;
}

/** Body accepted by PUT /companies/:id (updateCompanySchema) - every field optional. */
export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

/** Purpose: GET /companies - list companies/placement drives (any authenticated role). */
export function getCompanies() {
  return axiosInstance.get<CompanyRecord[]>("/companies").then((res) => res.data);
}

/** Purpose: GET /companies/:id - fetch one company's full detail. */
export function getCompanyById(id: number | string) {
  return axiosInstance
    .get<CompanyRecord>(`/companies/${id}`)
    .then((res) => res.data);
}

/** Purpose: POST /companies - add a company/drive (UPC/Admin or TPC only, per requireAdminTPC). */
export function createCompany(payload: CreateCompanyPayload) {
  return axiosInstance
    .post<CompanyRecord>("/companies", payload)
    .then((res) => res.data);
}

/** Purpose: PUT /companies/:id - edit a company/drive (UPC/Admin or TPC only). */
export function updateCompany(id: number | string, payload: UpdateCompanyPayload) {
  return axiosInstance
    .put<CompanyRecord>(`/companies/${id}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /companies/:id - remove a company/drive (UPC/Admin or TPC only). */
export function deleteCompany(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/companies/${id}`)
    .then((res) => res.data);
}
