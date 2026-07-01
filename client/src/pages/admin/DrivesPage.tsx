import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, Plus, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanies } from "../../hooks/useCompanies";
import { useCreateDrive, useDrives } from "../../hooks/useDrives";
import { formatDate } from "../../lib/format";
import { DEPARTMENTS } from "../../lib/validation";
import { paths } from "../../routes/paths";
import type {
  CreateDrivePayload,
  DriveStatus,
  EmploymentType,
} from "../../services/driveService";
import type { StatusTone } from "../../types";

import "../../styles/dashboard.css";
import "../../styles/form-wizard.css";

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "FTE",
  "Internship",
  "Internship + PPO",
];

/** Local form state - all inputs are strings/arrays and get coerced to the API's number/array shape on submit. */
interface DriveFormState {
  company_id: string;
  job_role: string;
  job_description: string;
  package_ctc: string;
  employment_type: EmploymentType;
  drive_date: string;
  application_deadline: string;
  minimum_cgpa: string;
  allowed_branches: string[];
  max_active_backlogs: string;
  max_passive_backlogs: string;
  number_of_rounds: string;
}

const EMPTY_FORM: DriveFormState = {
  company_id: "",
  job_role: "",
  job_description: "",
  package_ctc: "",
  employment_type: "FTE",
  drive_date: "",
  application_deadline: "",
  minimum_cgpa: "",
  allowed_branches: [],
  max_active_backlogs: "",
  max_passive_backlogs: "",
  number_of_rounds: "",
};

/** Purpose: map a drive's lifecycle status to a Badge tone. */
function statusTone(status: DriveStatus): StatusTone {
  switch (status) {
    case "ongoing":
      return "amber";
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "blue"; // upcoming
  }
}

/**
 * Purpose: build the POST /drive payload from the string form state - sending
 * numbers as real numbers (the backend uses z.number()) and omitting optional
 * fields when blank so we never send NaN/"" that would fail validation.
 */
function toCreatePayload(form: DriveFormState): CreateDrivePayload {
  const payload: CreateDrivePayload = {
    company_id: Number(form.company_id),
    employment_type: form.employment_type,
    drive_date: form.drive_date,
    application_deadline: form.application_deadline,
    minimum_cgpa: Number(form.minimum_cgpa),
    allowed_branches: form.allowed_branches,
  };

  if (form.job_role.trim()) payload.job_role = form.job_role.trim();
  if (form.job_description.trim())
    payload.job_description = form.job_description.trim();
  if (form.package_ctc !== "") payload.package_ctc = Number(form.package_ctc);
  if (form.max_active_backlogs !== "")
    payload.max_active_backlogs = Number(form.max_active_backlogs);
  if (form.max_passive_backlogs !== "")
    payload.max_passive_backlogs = Number(form.max_passive_backlogs);
  if (form.number_of_rounds !== "")
    payload.number_of_rounds = Number(form.number_of_rounds);

  return payload;
}

/**
 * Purpose: /Admin/drives and /TPC/drives - create and list real placement
 * drives via GET/POST /drive (useDrives/useCreateDrive). Each drive references
 * a company (company_id) and carries its own eligibility criteria; this
 * replaces the earlier "companies = drives" stand-in. Shared by Admin and TPC;
 * the backend authorizes both (requireAdminTPCSPC on POST /drive).
 */
export default function DrivesPage() {
  const { data: drives, isLoading, isError, error, refetch } = useDrives();
  const { data: companies } = useCompanies();
  const createMutation = useCreateDrive();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DriveFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();

  /** Drives only carry company_id; map to a name for display via the cached companies list. */
  const companyNameById = useMemo(() => {
    const map = new Map<number, string>();
    companies?.forEach((c) => map.set(c.company_id, c.company_name));
    return map;
  }, [companies]);

  const driveBasePath = paths.adminDrives;

  function toggleBranch(branch: string) {
    setForm((prev) => ({
      ...prev,
      allowed_branches: prev.allowed_branches.includes(branch)
        ? prev.allowed_branches.filter((b) => b !== branch)
        : [...prev.allowed_branches, branch],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.company_id) return setFormError("Select a company for this drive.");
    if (!form.drive_date) return setFormError("Pick a drive date.");
    if (!form.application_deadline)
      return setFormError("Pick an application deadline.");
    if (form.minimum_cgpa === "")
      return setFormError("Enter the minimum CGPA.");
    if (form.allowed_branches.length === 0)
      return setFormError("Select at least one eligible branch.");

    setFormError(undefined);
    createMutation.mutate(toCreatePayload(form), {
      onSuccess: () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
      },
    });
  }

  return (
    <>
      <Topbar
        title="Placement & internship drives"
        subtitle="Announce a new drive against a company and track active ones."
      />
      <div className="dashboard-content">
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h2>{showForm ? "Create drive" : "Drives"}</h2>
            <button
              className="secondary"
              type="button"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Cancel" : "Create drive"}
            </button>
          </div>

          {showForm && (
            <div className="panel-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <label>
                    Company
                    <select
                      value={form.company_id}
                      onChange={(e) =>
                        setForm({ ...form, company_id: e.target.value })
                      }
                    >
                      <option value="">Select a company...</option>
                      {companies?.map((c) => (
                        <option key={c.company_id} value={c.company_id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Employment type
                    <select
                      value={form.employment_type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          employment_type: e.target.value as EmploymentType,
                        })
                      }
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Job role
                    <input
                      value={form.job_role}
                      onChange={(e) =>
                        setForm({ ...form, job_role: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Package (CTC, LPA)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.package_ctc}
                      onChange={(e) =>
                        setForm({ ...form, package_ctc: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Drive date
                    <input
                      type="date"
                      value={form.drive_date}
                      onChange={(e) =>
                        setForm({ ...form, drive_date: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Application deadline
                    <input
                      type="date"
                      value={form.application_deadline}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          application_deadline: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Minimum CGPA
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={form.minimum_cgpa}
                      onChange={(e) =>
                        setForm({ ...form, minimum_cgpa: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Number of rounds
                    <input
                      type="number"
                      min="1"
                      value={form.number_of_rounds}
                      onChange={(e) =>
                        setForm({ ...form, number_of_rounds: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Max active backlogs
                    <input
                      type="number"
                      min="0"
                      value={form.max_active_backlogs}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          max_active_backlogs: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Max passive backlogs
                    <input
                      type="number"
                      min="0"
                      value={form.max_passive_backlogs}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          max_passive_backlogs: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    margin: "4px 0 18px",
                  }}
                >
                  Job description
                  <input
                    style={{
                      width: "100%",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "12px 13px",
                      marginTop: 7,
                    }}
                    placeholder="Role details, responsibilities, location..."
                    value={form.job_description}
                    onChange={(e) =>
                      setForm({ ...form, job_description: e.target.value })
                    }
                  />
                </label>

                <fieldset
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: "10px 13px",
                    marginBottom: 16,
                  }}
                >
                  <legend style={{ fontSize: 12, fontWeight: 700 }}>
                    Eligible branches
                  </legend>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 14,
                      marginTop: 6,
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <label
                        key={dept}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.allowed_branches.includes(dept)}
                          onChange={() => toggleBranch(dept)}
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {(formError || createMutation.isError) && (
                  <span className="field-error">
                    {formError ?? createMutation.error?.message}
                  </span>
                )}
                <div className="form-actions">
                  <p />
                  <button
                    className="primary"
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create drive"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {isLoading && <LoadingState label="Loading drives..." />}
        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load drives."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!drives || drives.length === 0) && (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="No drives announced yet"
            description="Create a drive above to start filtering eligible students."
          />
        )}

        {!isLoading && !isError && drives && drives.length > 0 && (
          <div className="two-column">
            {drives.map((drive) => (
              <section className="panel" key={drive.drive_id}>
                <div className="panel-head">
                  <h2>
                    {drive.job_role ||
                      companyNameById.get(drive.company_id) ||
                      `Drive #${drive.drive_id}`}
                  </h2>
                  <Badge tone={statusTone(drive.status)}>{drive.status}</Badge>
                </div>
                <div className="panel-body">
                  {drive.job_description && (
                    <p style={{ fontSize: 12, marginBottom: 12, whiteSpace: "pre-wrap" }}>
                      {drive.job_description}
                    </p>
                  )}
                  <div className="info-grid">
                    <div>
                      <span>Drive ID</span>
                      <b>{drive.drive_id}</b>
                    </div>
                    <div>
                      <span>Company</span>
                      <b>
                        {companyNameById.get(drive.company_id) ??
                          `#${drive.company_id}`}
                      </b>
                    </div>
                    <div>
                      <span>Role</span>
                      <b>{drive.job_role ?? "-"}</b>
                    </div>
                    <div>
                      <span>Type</span>
                      <b>{drive.employment_type}</b>
                    </div>
                    <div>
                      <span>Package (LPA)</span>
                      <b>{drive.package_ctc ?? "-"}</b>
                    </div>
                    <div>
                      <span>Min CGPA</span>
                      <b>{drive.minimum_cgpa}</b>
                    </div>
                    <div>
                      <span>Drive date</span>
                      <b>{formatDate(drive.drive_date)}</b>
                    </div>
                    <div>
                      <span>Deadline</span>
                      <b>{formatDate(drive.application_deadline)}</b>
                    </div>
                    <div>
                      <span>Max active backlogs</span>
                      <b>{drive.max_active_backlogs}</b>
                    </div>
                    <div>
                      <span>Max passive backlogs</span>
                      <b>{drive.max_passive_backlogs}</b>
                    </div>
                    <div>
                      <span>Rounds</span>
                      <b>{drive.number_of_rounds}</b>
                    </div>
                    <div>
                      <span>Branches</span>
                      <b>{drive.allowed_branches?.join(", ") || "-"}</b>
                    </div>
                    <div>
                      <span>Created</span>
                      <b>{formatDate(drive.created_at)}</b>
                    </div>
                    <div>
                      <span>Updated</span>
                      <b>{formatDate(drive.updated_at)}</b>
                    </div>
                  </div>
                  <div className="form-actions" style={{ marginTop: 14 }}>
                    <p />
                    <Link
                      className="text-btn"
                      to={`${driveBasePath}/${drive.drive_id}`}
                    >
                      Review applicants <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
