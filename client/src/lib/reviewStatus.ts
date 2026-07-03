import type { StatusTone } from "../types";

/**
 * Purpose: map a student's review_status to a human label + a <Badge> tone,
 * shared by the verification detail page and the SPC/TPC list screens so the
 * five statuses (pending / spc_verified / spc_rejected / verified / rejected)
 * read consistently everywhere.
 */
export function reviewStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "spc_verified":
      return "SPC verified";
    case "spc_rejected":
      return "SPC rejected";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

export function reviewStatusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case "verified":
      return "green";
    case "spc_verified":
      return "blue";
    case "spc_rejected":
    case "rejected":
      return "red";
    default:
      return "amber";
  }
}
