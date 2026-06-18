import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  XCircle,
} from "lucide-react";

import { Badge, DocumentItem, ErrorState, InfoGrid, LoadingState, ReviewSection } from "../../components/ui";
import { useSpcVerifyStudent, useStudent, useUpdateStudentRecord } from "../../hooks/useStudents";
import { formatCgpa, formatDate, initialsFromName } from "../../lib/format";
import { paths } from "../../routes/paths";

import "../../styles/verification.css";

/**
 * Purpose: /SPC/verification/:studentId and /TPC/verification/:studentId -
 * the two-pane document review + approve/reject screen described by the
 * brief's SPC/TPC Requirements. Shared by both roles via the `role` prop
 * (same pattern as the original prototype's VerificationPage), since the
 * layout and the underlying GET /students/:id record are identical - only
 * the workflow stage shown and which mutation fires on approve differ.
 *
 * NOTE: as documented in studentService.ts/useStudents.ts, the backend's
 * updateStudentSchema does not currently accept review_status, so the
 * approve/reject mutations below are sent but the database value will not
 * actually change until that schema gap is fixed server-side - out of scope
 * here since server/ is not to be modified.
 */
export default function StudentVerificationDetailPage({ role }: { role: "SPC" | "TPC" }) {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError, error, refetch } = useStudent(studentId);

  const spcVerify = useSpcVerifyStudent();
  const genericUpdate = useUpdateStudentRecord();
  const mutation = role === "SPC" ? spcVerify : genericUpdate;

  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");

  const backPath = role === "SPC" ? paths.spcVerification : paths.tpcVerification;

  function handleApprove() {
    if (!studentId) return;
    mutation.mutate(
      { id: studentId, payload: { review_status: role === "SPC" ? "spc_verified" : "verified" } },
      { onSuccess: () => navigate(backPath) },
    );
  }

  function handleReject() {
    if (!studentId) return;
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    mutation.mutate(
      { id: studentId, payload: { review_status: "rejected" } },
      { onSuccess: () => navigate(backPath) },
    );
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
  const activeDocument = documents.find((doc) => doc.url) ?? documents[0];

  return (
    <>
      <header className="review-topbar">
        <button className="icon-btn" onClick={() => navigate(backPath)} type="button">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1>Review student record</h1>
          <p>{student.roll_no}</p>
        </div>
      </header>

      <div className="review-layout">
        <section className="document-viewer">
          <div className="viewer-bar">
            <div>
              <FileText size={17} />
              <b>{activeDocument.label}</b>
            </div>
          </div>
          <div className="viewer-canvas">
            {activeDocument.url ? (
              <iframe
                title={activeDocument.label}
                src={activeDocument.url}
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
            <Badge tone={role === "TPC" ? "green" : "amber"}>
              {role === "TPC" ? "Pending final approval" : "Awaiting review"}
            </Badge>
          </div>

          {role === "TPC" && (
            <div className="mini-workflow">
              {["Submitted", "SPC verified", "TPC review", "Approved"].map((stage, i) => (
                <div className={i < 2 ? "done" : i === 2 ? "current" : ""} key={stage}>
                  <span>{i < 2 ? <Check size={12} /> : i + 1}</span>
                  <small>{stage}</small>
                </div>
              ))}
            </div>
          )}

          <ReviewSection title="Academic details">
            <InfoGrid
              items={[
                ["Roll number", student.roll_no],
                ["Department", student.branch ?? "-"],
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
            {student.active_backlogs > 0 ? (
              <div className="backlog-card">
                <div>
                  <b>{student.active_backlogs} active backlog(s)</b>
                  <span>{student.passive_backlogs} cleared previously</span>
                </div>
                <Badge tone="red">Active backlog</Badge>
              </div>
            ) : (
              <div className="backlog-card">
                <div>
                  <b>No active backlogs</b>
                  <span>{student.passive_backlogs} cleared previously</span>
                </div>
                <Badge tone="green">Clear</Badge>
              </div>
            )}
          </ReviewSection>

          <ReviewSection title="Documents">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.label}
                sem=""
                name={doc.label}
                meta={doc.url ? "Uploaded" : "Not uploaded yet"}
                tone={doc.url ? "green" : "gray"}
                status={doc.url ? "View" : "Missing"}
              />
            ))}
          </ReviewSection>

          {rejecting && (
            <textarea
              className="remarks"
              placeholder="Add rejection remarks for the student..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              autoFocus
            />
          )}

          {mutation.isError && <span className="field-error">{mutation.error.message}</span>}

          <div className="verification-actions">
            <button className="danger" type="button" onClick={handleReject} disabled={mutation.isPending}>
              <XCircle size={17} /> {rejecting ? "Confirm reject" : "Reject"}
            </button>
            <button className="primary" type="button" onClick={handleApprove} disabled={mutation.isPending}>
              <CheckCircle2 size={17} />
              {mutation.isPending
                ? "Saving..."
                : role === "SPC"
                  ? "Verify SPC level"
                  : "Final approve"}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
