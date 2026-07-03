# Admin/Student/Drives refactor — Phase 1 (+ Phase 2 round engine outline)

## Context

The portal is shifting from a **student-self-apply** model to an **admin-driven shortlist + rounds**
model, and trimming the dashboards. Exploration established the current backend reality:
- `applications` has only `current_round` + a flat `status` enum (`pending/approved/rejected/selected/
  not_selected`). **No attendance, no elimination reason, no start-round/auto-increment, no carry-over.**
- **No eligibility filtering** server-side (drives store `minimum_cgpa`/`max_active_backlogs`/
  `allowed_branches` but nothing uses them); the client-side filter in `AdminStudentsPage` (lines ~40-53)
  is reusable.
- **No notification system** — "student is notified when shortlisted" is satisfied by the drive
  appearing in their drives list (derived from their applications).
- `updateStudent` **already resets `review_status → 'pending'`** when any non-trivial field changes
  (ignored fields: `roll_no,name,email,phone,gender,region,religion,date_of_birth,resume_url`); there is
  **no edit-count limit**.
- Student apply is `POST /application/apply/:driveId`, `auth`-only (any user).

**User decisions:** phase the work (Phase 1 now; round engine = Phase 2); employment-type change is
**UI-label-only**; edit messaging is a **re-verification warning only** (no edit-count added).

### Change legend
`[FE]` frontend-only, no backend support · `[BE-rollback]` removes/restricts an existing backend
feature · `[BE-add]` new backend capability · `[DB]` needs a migration (write **and** apply to the
live DB — migrations are applied by hand here).

---

## PHASE 1 (this pass)

### 1. Admin dashboard `[FE]`
`client/src/pages/admin/AdminDashboard.tsx` — remove the four `StatCard`s + the `stats-row`, and the
now-unused `useStudents`/`useCompanies`/`useDrives` + icon imports. Keep only the **Quick links** panel
with exactly: Manage companies (`paths.adminCompanies`), Manage drives (`paths.adminDrives`), Invite
TPC/Admin (`paths.adminInvitations`), **Posts** (`paths.adminPosts`). Remove the "Filter & shortlist
students" link. The page reduces to a single panel (no data queries → no loading/error states needed).

### 2. Two-column cards equal size `[FE]`
`.two-column` in `client/src/styles/dashboard.css` is `grid-template-columns: 1.2fr 0.8fr`, which makes
the left card larger **everywhere** the class is used (Companies, Student dashboard, drives lists). Fix
it globally: change the rule to `grid-template-columns: 1fr 1fr` so all two-column grids have equal
halves.

### 3. Drives create form `[FE]` (+ employment-type `[BE]`/`[DB]`)
`client/src/pages/admin/DrivesPage.tsx`:
- **Employment type — rename the enum values** so the stored value *is* the display label (no
  label-mapping helper anywhere; less code overall). `[BE]` change `createDriveSchema`/`updateDriveSchema`
  in `server/src/lib/schema.js` to
  `z.enum(["Full Time Employment","Internship","Internship + Pre Placement Offer"])`. `[FE]` update
  `EmploymentType` + `EMPLOYMENT_TYPES` in `driveService.ts`/`DrivesPage.tsx` to the same three values.
  `[DB]` one-off data migration relabelling existing rows
  (`UPDATE drives SET employment_type='Full Time Employment' WHERE employment_type='FTE'`; and
  `…='Internship + Pre Placement Offer' WHERE employment_type='Internship + PPO'`) applied to the live DB
  (column is `VARCHAR(50)`; longest new value is 31 chars; no CHECK constraint exists).
- **Drop the "Number of rounds" field** from the form + `EMPTY_FORM` + payload (backend defaults it; it
  becomes auto-managed in Phase 2).
- **New branch names.** Replace the eligible-branches checkboxes (currently the old `DEPARTMENTS`) with
  the real branches from `DEPARTMENT_BRANCHES` (`client/src/lib/validation.ts`), grouped under each
  department heading; the checkbox values are the branch strings stored in `allowed_branches`. (The
  `students.branch` column is already `VARCHAR(150)` per migration 015, so long names fit.)

### 4. Drive detail = eligible list + checkbox shortlist `[FE]` + `[BE-rollback]`
`client/src/pages/admin/DriveApplicantsPage.tsx` becomes the drive's working screen:
- **Auto-filter eligible students** `[FE]`: over `useStudents()`, keep students matching the selected
  drive's criteria — `Number(cgpa) >= drive.minimum_cgpa`, `active_backlogs <= drive.max_active_backlogs`,
  `passive_backlogs <= drive.max_passive_backlogs`, and `drive.allowed_branches.includes(student.branch)`.
  Reuse the filter pattern from `AdminStudentsPage.tsx` (~40-53). Show this list whenever the drive is
  opened.
- **Checkbox selection + "Shortlist selected"** `[FE]`: track a `Set<studentId>`; on submit, create an
  application per selected student via `applyForDrive(driveId, studentId)` (existing
  `useApplyForDrive`). Also show the already-shortlisted students (`useDriveApplicants`) read-only with
  their status/round.
- **Remove the 5 per-row buttons** (Approve / Next round / Select / Reject / Not selected) and their
  hook calls — they're replaced by the Phase 2 round UI. (Backend endpoints remain but go unused this
  pass.)
- Remove the dangling `Start round` / per-round actions for now (Phase 2).

`server/src/routes/applicationRoutes.js` `[BE-rollback]`: add a role guard so **students can no longer
self-apply** — restrict `POST /apply/:driveId` (and `DELETE /:applicationId` withdraw) to
`requireAdminTPC`. Now "apply" == admin shortlist. Comment the change (`// CHANGE:` per `CLAUDE.md`) and
log it in `AUDIT.md`.

### 5. Admin students page → read-only roster `[FE]`
`client/src/pages/admin/AdminStudentsPage.tsx`: keep the roster, make search match **Roll No only**, keep
a **department filter** (filter `student.department` against `DEPARTMENT_OPTIONS`). Remove the Min-CGPA
input, the no-active-backlogs checkbox, the "select a drive to shortlist into" dropdown, and the
Shortlist button/column — plus the now-unused `useDrives`/`useCompanies`/`useApplyForDrive` imports.

### 6. Student dashboard `[FE]`
`client/src/pages/student/StudentDashboard.tsx`: remove the `welcome-card` (Placement-profile-overview +
CGPA ring, ~79-101) and the three `StatCard`s (~113-142). Keep only the **Verification status** section
and the **Quick links** section (~144-171). Drop now-unused imports (`StatCard`, `computeProfileCompletion`,
`formatCgpa`, etc.).

### 7. Student drives page `[FE]` + `[BE-rollback]`
`client/src/pages/student/PlacementDrivesPage.tsx`: remove Apply/Withdraw buttons and
`useApplyForDrive`/`useWithdrawApplication`. Keep listing all drives (browse) with details (new branch
names, employment label). For each drive, render a tiny badge **only if** the signed-in student has an
application for it (via `useStudentApplications`): `Shortlisted · Round {current_round}`; render nothing
otherwise. (Backend rollback of student apply is item 4.)

### 8. Student posts section `[FE]`
Already present: `NotificationsPage.tsx` shows admin posts read-only via `useCompanyPosts()` and is in
the student nav (`paths.studentNotifications`). Light polish only — ensure the label reads
"Announcements/Posts" and optionally add a quick-link to it from the student dashboard. No backend.

### 9. Profile-edit re-verification message `[FE]`
`client/src/pages/student/CompleteProfilePage.tsx`: add an informational hint near the form actions that
editing academic fields (CGPA, department/branch, graduation year, backlogs, 10th/12th %, semester SPIs,
marksheet URLs) will send the profile back for **re-verification** — mirroring the backend behavior that
already exists. Static hint (no backend change). No edit-count messaging (per decision).

---

## PHASE 2 (round-execution engine — separate pass, outlined)

Mostly `[BE-add]` + `[DB]` + new UI; it also **replaces** the flat approve/select endpoints removed from
the UI in Phase 1.

- `[DB]` add to `applications`: `attendance VARCHAR(20) DEFAULT 'pending'` (`pending/present/absent`),
  `reason TEXT` (elimination / not-selected reason); track the drive's active round (auto-incremented).
  Consider an `application_rounds` history table if per-round history is wanted.
- `[BE-add]` endpoints: `POST /drive/:driveId/start-round` (auto-increment round, reset attendance,
  carry the selected set forward), `PUT /application/:id/attendance`, `PUT /application/:id/eliminate`
  (pre-round removal w/ reason), and extend select/not-select to accept a `reason`. Optionally a bulk
  `POST /drive/:driveId/shortlist` enforcing eligibility server-side.
- `[FE]` DriveApplicantsPage round UI: pre-round filter (remove w/ reason) → Start round → attendance →
  mark selected / not-selected (w/ reason) → next round; final-round selected = final result.
- Student badge then reflects real per-round progression.

---

## Migration / data considerations
- **Employment type**: a small `[BE]` Zod-enum change + a one-off `[DB]` `UPDATE drives` to relabel
  existing rows (no CHECK constraint, so a plain UPDATE suffices). New drives store the new values.
- **Branches**: existing drives/students hold old branch values; new writes use the new names. No
  auto-migration (legacy rows just won't match the new dropdowns until re-saved). Note only.
- **Restricting apply**: no data change; purely a route guard. Any existing student-created applications
  remain valid.
- Phase 2 columns require a new migration **applied to the live DB by hand** (this project has no
  migration runner; the live DB lags the SQL files).

---

## Verification (Phase 1)
1. `cd client && npm run build` (tsc + vite) passes after each area.
2. **Admin dashboard**: only the Quick links panel with the 4 links (incl. Posts, no Filter/Shortlist).
3. **Companies**: the two company cards are equal width; other two-column pages unchanged.
4. **Drives create**: employment dropdown shows the three full labels; no rounds field; eligible-branch
   checkboxes show the new branch names; a created drive persists and lists correctly.
5. **Drive detail**: opening a drive shows the auto-filtered eligible students with checkboxes; "Shortlist
   selected" creates applications (visible in the shortlisted list); old per-row buttons are gone.
6. **Student apply blocked**: as a student, `POST /application/apply/...` returns 403; the student drives
   page has no Apply button and shows `Shortlisted · Round N` only for drives they're shortlisted into.
7. **Admin students**: roster search-by-roll-no + department filter only; no shortlist controls.
8. **Student dashboard**: only Verification status + Quick links.
9. **Profile edit**: the re-verification hint is visible; editing an academic field still flips
   `review_status` to pending (unchanged backend behavior).
10. `node --check` passes on any changed backend file (`applicationRoutes.js`).