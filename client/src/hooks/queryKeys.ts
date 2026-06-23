/**Purpose: one place that defines every TanStack Query key used in this app, so an invalidateQueries() call after a mutation can never typo a key that a useQuery() elsewhere is actually listening on.*/
export const queryKeys = {
  profile: ["students", "me"] as const,
  students: () => ["students", "list"] as const,
  student: (id: number | string) => ["students", "detail", id] as const,
  companies: ["companies", "list"] as const,
  company: (id: number | string) => ["companies", "detail", id] as const,
  drives: ["drives", "list"] as const,
  drive: (id: number | string) => ["drives", "detail", id] as const,
  driveApplicants: (driveId: number | string) =>
    ["drives", "applicants", driveId] as const,
  driveResults: (driveId: number | string) =>
    ["drives", "results", driveId] as const,
  applications: ["applications", "list"] as const,
  studentApplications: (studentId: number | string) =>
    ["applications", "student", studentId] as const,
  notifications: ["notifications", "list"] as const,
  tpcs: ["tpc", "list"] as const,
};
