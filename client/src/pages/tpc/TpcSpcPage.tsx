import { useState } from "react";
import { UserCog, Users } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useAssignSpc, useTpcBranches, useTpcSpcs } from "../../hooks/useVerification";

import "../../styles/dashboard.css";
import "../../styles/data-table.css";

/**
 * Purpose: /TPC/coordinators - pick a branch, see its SPCs (ordered by spc_id),
 * and click "Assign students to SPC for verification" to divide that branch's
 * students evenly among its SPCs (per semester). Only assigned students appear
 * in an SPC's verification queue.
 */
export default function TpcSpcPage() {
  const [branch, setBranch] = useState("");
  const { data: branches } = useTpcBranches();
  const { data: spcs, isLoading, isError, error, refetch } = useTpcSpcs(branch || undefined);
  const assign = useAssignSpc();
  const result = assign.data;

  const canAssign = Boolean(branch) && (spcs?.length ?? 0) > 0 && !assign.isPending;

  return (
    <>
      <Topbar title="SPC coordinators" subtitle="Assign students to SPCs for verification, by branch." />
      <div className="dashboard-content">
        <section className="panel queue-panel">
          <div className="queue-head">
            <div>
              <div className="eyebrow">SPC assignment</div>
              <h2>Coordinators by branch</h2>
              <p>Pick a branch, then split its students among its SPCs (evenly, per semester).</p>
            </div>
            <button className="primary" type="button" onClick={() => assign.mutate(branch)} disabled={!canAssign}>
              {assign.isPending ? "Assigning..." : "Assign students to SPC for verification"}
            </button>
          </div>

          <div className="table-tools">
            <select
              className="filter-select"
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                assign.reset();
              }}
            >
              <option value="">Select a branch</option>
              {(branches ?? []).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {assign.isError && (
            <div style={{ padding: "0 24px 12px" }}>
              <span className="field-error">{assign.error.message}</span>
            </div>
          )}
          {result && (
            <div
              style={{
                margin: "0 24px 12px",
                padding: "10px 12px",
                background: "#eaf6f0",
                border: "1px solid #cfe9dd",
                borderRadius: 8,
                fontSize: 10,
                color: "#256b52",
              }}
            >
              Assigned {result.totalAssigned} student(s) across {Object.keys(result.perSpc).length}{" "}
              SPC(s). Counts are shown per SPC below.
            </div>
          )}

          {!branch ? (
            <EmptyState
              icon={<UserCog size={28} />}
              title="Select a branch"
              description="Choose a branch to see its SPCs and assign students."
            />
          ) : isLoading ? (
            <LoadingState label="Loading SPCs..." />
          ) : isError ? (
            <ErrorState message={error?.message ?? "Could not load SPCs."} onRetry={refetch} />
          ) : (spcs?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Users size={28} />}
              title="No SPCs in this branch"
              description="Promote a student to SPC from the Students section first."
            />
          ) : (
            <div className="data-table">
              <div className="data-row data-head">
                <span>SPC</span>
                <span>Roll no</span>
                <span>Semester</span>
                <span>Branch</span>
                <span>Assigned</span>
              </div>
              {(spcs ?? []).map((s) => (
                <div className="data-row" key={s.spc_id}>
                  <span className="student-cell">
                    <i>{(s.name ?? "?").slice(0, 2).toUpperCase()}</i>
                    <span>
                      <b>{s.name}</b>
                      <small>{s.email}</small>
                    </span>
                  </span>
                  <span>{s.roll_no ?? "-"}</span>
                  <span>{s.semester ?? "-"}</span>
                  <span>{s.branch ?? "-"}</span>
                  <span>
                    {result?.perSpc?.[s.spc_id] != null ? (
                      <Badge tone="green">{result.perSpc[s.spc_id]}</Badge>
                    ) : (
                      `#${s.spc_id}`
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
