/**Purpose: one place that defines every TanStack Query key used in this app, so an invalidateQueries() call after a mutation can never typo a key that a useQuery() elsewhere is actually listening on.*/
export const queryKeys = {
  profile: ["students", "me"] as const,
  students: () => ["students", "list"] as const,
  student: (id: number | string) => ["students", "detail", id] as const,
  companies: ["companies", "list"] as const,
  company: (id: number | string) => ["companies", "detail", id] as const,
  drives: ["drives", "list"] as const,
  drive: (id: number | string) => ["drives", "detail", id] as const,
  // Confirmed shortlist for a drive (the `drive_students` table). The old
  // application-based `driveApplicants`/`driveResults`/`studentApplications`
  // keys were removed with the applications workflow.
  driveStudents: (driveId: number | string) =>
    ["drives", "students", driveId] as const,
  // Student self-scoped drive views.
  myDrives: ["drives", "mine"] as const,
  myDriveResults: (driveId: number | string) =>
    ["drives", "myResults", driveId] as const,
  // Admin per-round history for a drive.
  driveHistory: (driveId: number | string, round: number | string) =>
    ["drives", "history", driveId, round] as const,
  // Per-round dates for a drive.
  driveRounds: (driveId: number | string) => ["drives", "rounds", driveId] as const,
  notifications: ["notifications", "list"] as const,
  companyPosts: ["companyPosts", "list"] as const,
  companyPost: (id: number | string) => ["companyPosts", "detail", id] as const,
  postAttachments: (postId: number | string) =>
    ["companyPosts", "attachments", postId] as const,
  tpcs: ["tpc", "list"] as const,
  // Verification pipeline
  spcQueue: ["spc", "queue"] as const,
  tpcStudents: (rollNo?: string) => ["tpc", "students", rollNo ?? ""] as const,
  tpcQueue: (branch?: string) => ["tpc", "queue", branch ?? ""] as const,
  tpcSpcVerified: (branch?: string) =>
    ["tpc", "spcVerified", branch ?? ""] as const,
  tpcBranches: ["tpc", "branches"] as const,
  tpcSpcs: (branch: string) => ["tpc", "spcs", branch] as const,
};
