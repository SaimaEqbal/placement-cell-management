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

import { Badge, ErrorState, InfoGrid, LoadingState, ReviewSection } from "../../components/ui";
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

import "../../styles/verification.css";

/**
 * Purpose: /SPC/verification/:studentId, /TPC/verification/:studentId and
 * /TPC/students/:studentId - the shared two-pane review + action screen.
 *
 * `role` selects which verify/reject endpoint fires (SPC vs TPC). `mode`
 * selects the action set: "verify" (approve/reject, the default) or "manage"
 * (the TPC roster's delete / promote-to-SPC / demote actions).
 *
 * The queue/roster pages pass `{ ids, backPath }` via router state so this page
 * can offer a "Next student" button and return to the right list.
 */

type ReviewLocationState = { ids?: number[]; backPath?: string } | null;

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
      <div className="review-layout" style={{ gridTemplateColumns: "1fr" }}>
        <LoadingState label="Loading student record..." />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="review-layout" style={{ gridTemplateColumns: "1fr" }}>
        <ErrorState message={error?.message ?? "Could not load this student."} onRetry={refetch} />
      </div>
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
      <header className="review-topbar">
        <button className="icon-btn" onClick={() => navigate(backPath)} type="button">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1>{mode === "manage" ? "Student details" : "Review student record"}</h1>
          <p>{student.roll_no}</p>
        </div>
      </header>

      <div className="review-layout">
        <section className="document-viewer">
          <div className="viewer-bar">
            <div>
              <FileText size={17} />
              <b>{active.label}</b>
            </div>
            {active.url && (
              <a className="row-action" href={active.url} target="_blank" rel="noreferrer">
                Open in new tab <ExternalLink size={13} />
              </a>
            )}
          </div>
          <div className="viewer-canvas">
            {active.url ? (
              <iframe
                title={active.label}
                src={active.url}
                style={{ width: 580, minHeight: 760, border: "none", background: "#fff" }}
              />
            ) : (
              <div className="marksheet" style={{ display: "grid", placeItems: "center" }}>
                <span>No document uploaded for this record yet.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="review-panel">
          <div className="candidate-head">
            <div className="candidate-avatar">{initialsFromName(student.name)}</div>
            <div>
              <h2>{student.name}</h2>
              <p>
                {student.roll_no} · {student.branch ?? "Branch not set"}
              </p>
            </div>
            <Badge tone={reviewStatusTone(student.review_status)}>
              {reviewStatusLabel(student.review_status)}
            </Badge>
          </div>

          <ReviewSection title="Academic details">
            <InfoGrid
              items={[
                ["Roll number", student.roll_no],
                ["Department", student.department ?? "-"],
                ["Branch", student.branch ?? "-"],
                ["Semester", student.semester ? String(student.semester) : "-"],
                ["Graduation year", student.graduation_year ? String(student.graduation_year) : "-"],
                ["CGPA", formatCgpa(student.cgpa)],
                ["Contact", student.phone ?? "-"],
                ["Date of birth", formatDate(student.date_of_birth)],
              ]}
            />
          </ReviewSection>

          <ReviewSection
            title="Backlog details"
            badge={student.active_backlogs > 0 ? `${student.active_backlogs} active` : undefined}
          >
            <div className="backlog-card">
              <div>
                <b>
                  {student.active_backlogs > 0
                    ? `${student.active_backlogs} active backlog(s)`
                    : "No active backlogs"}
                </b>
                <span>{student.passive_backlogs} cleared previously</span>
              </div>
              <Badge tone={student.active_backlogs > 0 ? "red" : "green"}>
                {student.active_backlogs > 0 ? "Active backlog" : "Clear"}
              </Badge>
            </div>
          </ReviewSection>

          {student.rejection_reason && (
            <ReviewSection title="Rejection reason">
              <p className="reject-reason">{student.rejection_reason}</p>
            </ReviewSection>
          )}

          <ReviewSection title="Documents">
            {documents.map((doc, i) => (
              <button
                key={doc.label}
                type="button"
                className={`doc-select ${i === activeDoc ? "active" : ""}`}
                onClick={() => doc.url && setActiveDoc(i)}
                disabled={!doc.url}
              >
                <FileText size={15} />
                <span className="doc-sel-text">
                  <b>{doc.label}</b>
                  <small>{doc.url ? "Click to view on the left" : "Not uploaded"}</small>
                </span>
                <Badge tone={doc.url ? "green" : "gray"}>{doc.url ? "View" : "Missing"}</Badge>
              </button>
            ))}
          </ReviewSection>

          {mode === "verify" ? (
            <>
              {rejecting && (
                <textarea
                  className="remarks"
                  placeholder="Add a reason for rejecting this profile..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  autoFocus
                />
              )}
              {(verifyMutation.isError || rejectMutation.isError) && (
                <span className="field-error" style={{ padding: "0 20px" }}>
                  {(verifyMutation.error ?? rejectMutation.error)?.message}
                </span>
              )}
              <div className="verification-actions">
                <button className="danger" type="button" onClick={handleReject} disabled={busy}>
                  <XCircle size={17} /> {rejecting ? "Confirm reject" : "Reject"}
                </button>
                <button className="primary" type="button" onClick={handleVerify} disabled={busy}>
                  <CheckCircle2 size={17} />
                  {verifyMutation.isPending
                    ? "Saving..."
                    : role === "SPC"
                      ? "Verify (SPC)"
                      : "Verify (final)"}
                </button>
              </div>
            </>
          ) : (
            <>
              {manageError && (
                <span className="field-error" style={{ padding: "0 20px" }}>
                  {manageError.message}
                </span>
              )}
              <div className="verification-actions">
                <button className="danger" type="button" onClick={handleDelete} disabled={busy}>
                  <Trash2 size={16} /> Delete
                </button>
                {student.is_spc ? (
                  <button className="secondary" type="button" onClick={handleDemote} disabled={busy}>
                    <UserMinus size={16} /> Demote from SPC
                  </button>
                ) : (
                  <button className="primary" type="button" onClick={handlePromote} disabled={busy}>
                    <ShieldCheck size={16} /> Promote to SPC
                  </button>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {nextId !== undefined && (
        <button type="button" className="next-student-fab" onClick={goToNext} disabled={busy}>
          Next student <ArrowRight size={15} />
        </button>
      )}
    </>
  );
}
