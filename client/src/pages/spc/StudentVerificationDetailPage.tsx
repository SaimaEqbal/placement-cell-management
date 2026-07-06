import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  Trash2,
  UserMinus,
  XCircle,
} from "lucide-react";

import { InfoGrid } from "@/components/dashboard/InfoGrid";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStudent } from "../../hooks/useStudents";
import {
  useDemoteSpc,
  usePromoteSpc,
  useSpcReject,
  useSpcVerify,
  useTpcDeleteStudent,
  useTpcReject,
  useTpcVerify,
} from "../../hooks/useVerification";
import { formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { reviewStatusLabel, reviewStatusTone } from "../../lib/reviewStatus";

/**
 * Purpose: /SPC/verification/:studentId, /TPC/verification/:studentId and
 * /TPC/students/:studentId - the shared review + action screen.
 *
 * `role` selects which verify/reject endpoint fires (SPC vs TPC). `mode`
 * selects the action set: "verify" (approve/reject, the default) or "manage"
 * (the TPC roster's delete / promote-to-SPC / demote actions).
 *
 * The queue/roster pages pass `{ ids, backPath }` via router state so this page
 * can offer a "Next student" button and return to the right list.
 */

type ReviewLocationState = { ids?: number[]; backPath?: string } | null;

/** Sticky header with a back button and the record title. */
function DetailHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Button variant="outline" size="icon" onClick={onBack} aria-label="Back">
        <ArrowLeft />
      </Button>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </header>
  );
}

export default function StudentVerificationDetailPage({
  role,
  mode = "verify",
}: {
  role: "SPC" | "TPC";
  mode?: "verify" | "manage";
}) {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ReviewLocationState;

  const { data: student, isLoading, isError, error, refetch } = useStudent(studentId);

  // Verify-mode mutations
  const spcVerify = useSpcVerify();
  const spcReject = useSpcReject();
  const tpcVerify = useTpcVerify();
  const tpcReject = useTpcReject();
  // Manage-mode mutations
  const promote = usePromoteSpc();
  const demote = useDemoteSpc();
  const removeStudent = useTpcDeleteStudent();

  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [activeDoc, setActiveDoc] = useState(0);

  // The list this detail belongs to, for back + "next" navigation. detailBase is
  // the current route minus the :studentId segment (e.g. /TPC/verification).
  const detailBase = location.pathname.replace(/\/[^/]+$/, "");
  const backPath = state?.backPath ?? detailBase;
  const ids = state?.ids ?? [];

  const nextId = useMemo(() => {
    if (!studentId || ids.length === 0) return undefined;
    const idx = ids.indexOf(Number(studentId));
    return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : undefined;
  }, [ids, studentId]);

  const verifyMutation = role === "SPC" ? spcVerify : tpcVerify;
  const rejectMutation = role === "SPC" ? spcReject : tpcReject;

  function goToNext() {
    if (nextId !== undefined) navigate(`${detailBase}/${nextId}`, { state });
  }

  function afterAction() {
    if (nextId !== undefined) navigate(`${detailBase}/${nextId}`, { state });
    else navigate(backPath);
  }

  function handleVerify() {
    if (!studentId) return;
    verifyMutation.mutate(studentId, { onSuccess: afterAction });
  }

  function handleReject() {
    if (!studentId) return;
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    if (!remarks.trim()) return;
    rejectMutation.mutate({ id: studentId, reason: remarks.trim() }, { onSuccess: afterAction });
  }

  function handleDelete() {
    if (!studentId) return;
    if (!window.confirm("Delete this student permanently? This cannot be undone.")) return;
    removeStudent.mutate(studentId, { onSuccess: () => navigate(backPath) });
  }

  function handlePromote() {
    if (!studentId) return;
    if (!window.confirm("Promote this student to SPC?")) return;
    promote.mutate(studentId, { onSuccess: () => navigate(backPath) });
  }

  function handleDemote() {
    if (!studentId) return;
    if (!window.confirm("Demote this SPC back to a student?")) return;
    demote.mutate(studentId, { onSuccess: () => navigate(backPath) });
  }

  if (isLoading) {
    return (
      <>
        <DetailHeader title="Review student record" onBack={() => navigate(backPath)} />
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
          <LoadingState label="Loading student record..." />
        </div>
      </>
    );
  }

  if (isError || !student) {
    return (
      <>
        <DetailHeader title="Review student record" onBack={() => navigate(backPath)} />
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
          <ErrorState message={error?.message ?? "Could not load this student."} onRetry={refetch} />
        </div>
      </>
    );
  }

  const documents: Array<{ label: string; url: string | null }> = [
    { label: "Resume", url: student.resume_url },
    { label: "10th marksheet", url: student.tenth_marksheet_url },
    { label: "12th marksheet", url: student.twelfth_marksheet_url },
    { label: "Latest semester marksheet", url: student.last_sem_marksheet_url },
  ];
  const active = documents[activeDoc] ?? documents[0];

  const busy =
    verifyMutation.isPending ||
    rejectMutation.isPending ||
    promote.isPending ||
    demote.isPending ||
    removeStudent.isPending;

  const manageError = promote.error ?? demote.error ?? removeStudent.error;

  return (
    <>
      <DetailHeader
        title={mode === "manage" ? "Student details" : "Review student record"}
        subtitle={student.roll_no}
        onBack={() => navigate(backPath)}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 md:p-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Document viewer */}
        <Card className="order-2 overflow-hidden lg:order-1 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{active.label}</span>
            </div>
            {active.url && (
              <a
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                href={active.url}
                target="_blank"
                rel="noreferrer"
              >
                Open in new tab <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <div className="bg-muted/40 p-3">
            {active.url ? (
              <iframe
                title={active.label}
                src={active.url}
                className="h-[60vh] w-full rounded-md border bg-white lg:h-[calc(100vh-13rem)]"
              />
            ) : (
              <div className="grid h-[40vh] place-items-center rounded-md border border-dashed text-sm text-muted-foreground lg:h-[calc(100vh-13rem)]">
                No document uploaded for this record yet.
              </div>
            )}
          </div>
        </Card>

        {/* Review panel */}
        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted font-semibold">
                {initialsFromName(student.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{student.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {student.roll_no} · {student.branch ?? "Branch not set"}
                </div>
              </div>
              <StatusBadge tone={reviewStatusTone(student.review_status)}>
                {reviewStatusLabel(student.review_status)}
              </StatusBadge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Academic details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <InfoGrid
                items={[
                  ["Roll number", student.roll_no],
                  ["Department", student.department ?? "—"],
                  ["Branch", student.branch ?? "—"],
                  ["Semester", student.semester ? String(student.semester) : "—"],
                  ["Graduation year", student.graduation_year ? String(student.graduation_year) : "—"],
                  ["CGPA", formatCgpa(student.cgpa)],
                  ["Contact", student.phone ?? "—"],
                  ["Date of birth", formatDate(student.date_of_birth)],
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-3">
              <CardTitle className="text-sm">Backlog details</CardTitle>
              {student.active_backlogs > 0 && (
                <StatusBadge tone="red">{student.active_backlogs} active</StatusBadge>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {student.active_backlogs > 0
                    ? `${student.active_backlogs} active backlog(s)`
                    : "No active backlogs"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {student.passive_backlogs} cleared previously
                </div>
              </div>
              <StatusBadge tone={student.active_backlogs > 0 ? "red" : "green"}>
                {student.active_backlogs > 0 ? "Active backlog" : "Clear"}
              </StatusBadge>
            </CardContent>
          </Card>

          {student.rejection_reason && (
            <Card>
              <CardHeader className="border-b py-3">
                <CardTitle className="text-sm">Rejection reason</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {student.rejection_reason}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-3">
              {documents.map((doc, i) => (
                <button
                  key={doc.label}
                  type="button"
                  onClick={() => doc.url && setActiveDoc(i)}
                  disabled={!doc.url}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60",
                    doc.url && "hover:bg-muted/50",
                    i === activeDoc && doc.url && "border-foreground bg-muted/50",
                  )}
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{doc.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.url ? "Tap to view" : "Not uploaded"}
                    </div>
                  </div>
                  <StatusBadge tone={doc.url ? "green" : "gray"}>
                    {doc.url ? "View" : "Missing"}
                  </StatusBadge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          {mode === "verify" ? (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                {rejecting && (
                  <Textarea
                    placeholder="Add a reason for rejecting this profile..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    autoFocus
                  />
                )}
                {(verifyMutation.isError || rejectMutation.isError) && (
                  <p className="text-sm text-destructive">
                    {(verifyMutation.error ?? rejectMutation.error)?.message}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="destructive" type="button" onClick={handleReject} disabled={busy}>
                    <XCircle /> {rejecting ? "Confirm reject" : "Reject"}
                  </Button>
                  <Button type="button" onClick={handleVerify} disabled={busy}>
                    <CheckCircle2 />
                    {verifyMutation.isPending
                      ? "Saving..."
                      : role === "SPC"
                        ? "Verify (SPC)"
                        : "Verify (final)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                {manageError && (
                  <p className="text-sm text-destructive">{manageError.message}</p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="destructive" type="button" onClick={handleDelete} disabled={busy}>
                    <Trash2 /> Delete
                  </Button>
                  {student.is_spc ? (
                    <Button variant="secondary" type="button" onClick={handleDemote} disabled={busy}>
                      <UserMinus /> Demote from SPC
                    </Button>
                  ) : (
                    <Button type="button" onClick={handlePromote} disabled={busy}>
                      <ShieldCheck /> Promote to SPC
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {nextId !== undefined && (
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={goToNext}
              disabled={busy}
            >
              Next student <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
