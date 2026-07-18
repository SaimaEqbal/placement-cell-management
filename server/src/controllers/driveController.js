import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";
import { insertAnnouncement, replaceAttachments } from "../lib/announcements.js";
import { isPlacementDrive, SECOND_CHANCE_MULTIPLIER } from "../lib/placementRules.js";
import { createNotificationForRole } from "./notificationController.js";

// ---------------------------------------------------------------------------
// Eligibility engine. A student is eligible for a drive when they are verified,
// still unplaced, meet the CGPA floor, are within both backlog caps, and belong
// to an allowed branch. The result is computed on the fly (never persisted) and
// returned by create/update so the admin can review and confirm a subset.
// ---------------------------------------------------------------------------
async function getEligibleStudentsForDrive(drive) {
  const result = await pool.query(
    `SELECT
        id,
        roll_no,
        name,
        email,
        phone,
        branch,
        department,
        cgpa,
        active_backlogs,
        passive_backlogs
     FROM students
     WHERE
        review_status = 'verified'
        AND cgpa >= $1
        AND active_backlogs <= $2
        AND passive_backlogs <= $3
        AND branch = ANY($4)
        -- Batch filter: restrict to the drive's target graduation years. A NULL
        -- allowed_batches (legacy drives created before this column) means no
        -- batch restriction.
        AND ($5::int[] IS NULL OR batch = ANY($5))
        -- "Minimum CGPA throughout": when set, every RECORDED (non-null) semester
        -- SPI must be >= the value. NULL = no throughout constraint.
        AND (
          $6::numeric IS NULL OR (
            (sem1_spi IS NULL OR sem1_spi >= $6) AND
            (sem2_spi IS NULL OR sem2_spi >= $6) AND
            (sem3_spi IS NULL OR sem3_spi >= $6) AND
            (sem4_spi IS NULL OR sem4_spi >= $6) AND
            (sem5_spi IS NULL OR sem5_spi >= $6) AND
            (sem6_spi IS NULL OR sem6_spi >= $6) AND
            (sem7_spi IS NULL OR sem7_spi >= $6) AND
            (sem8_spi IS NULL OR sem8_spi >= $6)
          )
        )
        -- Second-chance rule (placement drives only; $7 = FALSE for internships,
        -- which are open regardless of placement state):
        --   * second_chance students are done - never eligible again.
        --   * placed students are eligible only when this drive's package is
        --     >= MULTIPLIER x the package they were placed at.
        AND (
          $7::boolean = FALSE
          OR placement_status IS NULL
          OR placement_status NOT IN ('placed', 'second_chance')
          OR (
            placement_status = 'placed'
            AND placed_package IS NOT NULL
            AND $8::numeric IS NOT NULL
            AND $8::numeric >= placed_package * ${SECOND_CHANCE_MULTIPLIER}
          )
        )
     ORDER BY cgpa DESC`,
    [
      drive.minimum_cgpa,
      drive.max_active_backlogs,
      drive.max_passive_backlogs,
      drive.allowed_branches,
      drive.allowed_batches ?? null,
      drive.minimum_cgpa_throughout ?? null,
      isPlacementDrive(drive.employment_type),
      drive.package_ctc ?? null,
    ]
  );

  return result.rows;
}

// A drive's date/deadline can be "TBD" (or blank) when not yet finalised; store
// that as NULL rather than writing a non-date string into a DATE column.
const dateOrNull = (value) => (value && value !== "TBD" ? value : null);

// Human label for a round in user-facing text: round 0 is the company screening.
const roundText = (roundNo) =>
  roundNo === 0 ? "the company screening" : `Round ${roundNo}`;
const roundTextCap = (roundNo) =>
  roundNo === 0 ? "The company screening" : `Round ${roundNo}`;

// ---------------------------------------------------------------------------
// Transaction helpers shared by the round-workflow endpoints. Every mutating
// endpoint loads the parent drive FOR UPDATE first, so concurrent admins are
// serialised and each state guard reads authoritative state under lock.
// ---------------------------------------------------------------------------

/** Load a drive row FOR UPDATE inside a transaction. Returns the row or null. */
async function loadDriveForUpdate(client, driveId) {
  const result = await client.query(
    `SELECT * FROM drives WHERE drive_id = $1 FOR UPDATE`,
    [driveId]
  );
  return result.rows[0] ?? null;
}

/** Load one drive_students row scoped to its drive. Returns the row or null. */
async function loadDriveStudent(client, driveStudentId, driveId) {
  const result = await client.query(
    `SELECT * FROM drive_students
      WHERE drive_student_id = $1 AND drive_id = $2
      FOR UPDATE`,
    [driveStudentId, driveId]
  );
  return result.rows[0] ?? null;
}

/** Append one immutable event to the drive_round_history audit trail. */
async function recordHistory(
  client,
  { driveId, studentId, roundNo, stage, result, reason = null, recordedBy = null }
) {
  await client.query(
    `INSERT INTO drive_round_history
       (drive_id, student_id, round_no, stage, result, reason, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [driveId, studentId, roundNo, stage, result, reason, recordedBy]
  );
}

/**
 * Raise the same notification for a set of students (by students.id) in one
 * insert, resolving each to its users.id. Reuses the shared notifications table;
 * students without a linked user are skipped. Runs on the passed transaction
 * client so it commits atomically with the stage action that triggered it.
 */
async function notifyStudentsByIds(client, studentIds, title, message, tone = "blue") {
  if (!studentIds || studentIds.length === 0) return;
  await client.query(
    `INSERT INTO notifications (user_id, title, message, tone)
     SELECT s.user_id, $2, $3, $4
     FROM students s
     WHERE s.id = ANY($1) AND s.user_id IS NOT NULL`,
    [studentIds, title, message, tone]
  );
}

/** A human label for a drive used in notification text ("Role (Company)" or the company name). */
async function getDriveLabel(client, drive) {
  const r = await client.query(
    `SELECT company_name FROM companies WHERE company_id = $1`,
    [drive.company_id]
  );
  const company = r.rows[0]?.company_name ?? "the company";
  return drive.job_role ? `${drive.job_role} at ${company}` : company;
}

/**
 * Publish this round's results to everyone who reached them: SELECTED students
 * progress (or are placed, when `final`), REJECTED students are eliminated. Reads
 * status BEFORE the caller advances/places, so call it first.
 */
async function notifyRoundResults(client, drive, { final = false } = {}) {
  const round = drive.current_round;
  const rows = await client.query(
    `SELECT student_id, status FROM drive_students
      WHERE drive_id = $1 AND current_round = $2 AND status IN ('SELECTED', 'REJECTED')`,
    [drive.drive_id, round]
  );
  if (rows.rows.length === 0) return;

  const label = await getDriveLabel(client, drive);
  const selectedIds = rows.rows.filter((r) => r.status === "SELECTED").map((r) => r.student_id);
  const rejectedIds = rows.rows.filter((r) => r.status === "REJECTED").map((r) => r.student_id);

  if (final) {
    if (isPlacementDrive(drive.employment_type)) {
      await notifyStudentsByIds(
        client,
        selectedIds,
        "You've been placed!",
        `Congratulations! You have been placed via ${label}.`,
        "green"
      );
    } else {
      await notifyStudentsByIds(
        client,
        selectedIds,
        "Selected for internship!",
        `Congratulations! You have been selected for the internship via ${label}.`,
        "green"
      );
    }
  } else {
    await notifyStudentsByIds(
      client,
      selectedIds,
      "You cleared a round",
      `You cleared ${roundText(round)} of ${label} and move on to the next round.`,
      "green"
    );
  }

  await notifyStudentsByIds(
    client,
    rejectedIds,
    "Round result",
    `You did not clear ${roundText(round)} of ${label}.`,
    "red"
  );
}

/**
 * Batch-resolve the current round's results from the checkbox decisions. Every
 * still-ACTIVE student in the current round is resolved: those listed in
 * `rejected` (each { driveStudentId, reason }) become REJECTED with their reason;
 * everyone else becomes SELECTED. Both outcomes are written to RESULT history.
 * Returns the number of SELECTED (cleared) students. Runs on the caller's txn.
 */
async function resolveRoundResults(client, drive, rejected, recordedBy) {
  const reasonById = new Map(rejected.map((r) => [r.driveStudentId, r.reason]));

  const active = await client.query(
    `SELECT drive_student_id, student_id
       FROM drive_students
      WHERE drive_id = $1 AND status = 'ACTIVE' AND current_round = $2
      FOR UPDATE`,
    [drive.drive_id, drive.current_round]
  );

  let selectedCount = 0;
  for (const row of active.rows) {
    // drive_student_id is a bigint (string from node-pg); the decision ids were
    // coerced to numbers by the schema, so normalise for the lookup.
    const key = Number(row.drive_student_id);
    if (reasonById.has(key)) {
      const reason = reasonById.get(key);
      await client.query(
        `UPDATE drive_students SET status = 'REJECTED', remarks = $2 WHERE drive_student_id = $1`,
        [row.drive_student_id, reason]
      );
      await recordHistory(client, {
        driveId: drive.drive_id,
        studentId: row.student_id,
        roundNo: drive.current_round,
        stage: "RESULT",
        result: "REJECTED",
        reason,
        recordedBy,
      });
    } else {
      await client.query(
        `UPDATE drive_students SET status = 'SELECTED' WHERE drive_student_id = $1`,
        [row.drive_student_id]
      );
      await recordHistory(client, {
        driveId: drive.drive_id,
        studentId: row.student_id,
        roundNo: drive.current_round,
        stage: "RESULT",
        result: "SELECTED",
        recordedBy,
      });
      selectedCount++;
    }
  }
  return selectedCount;
}

// ---------------------------------------------------------------------------
// Drive CRUD
// ---------------------------------------------------------------------------

// Create a drive, optionally with an announcement in the SAME request. The drive
// and its announcement (+ attachments) are created atomically: if the requested
// announcement fails to save, the whole operation rolls back and no drive is
// left behind. The announcement, when present, is automatically linked to the
// new drive via company_posts.drive_id.
export const createDrive = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      minimum_cgpa,
      minimum_cgpa_throughout,
      allowed_branches,
      allowed_batches,
      max_active_backlogs,
      max_passive_backlogs,
      number_of_rounds,
      announcement,
    } = req.body;

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO drives (
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        minimum_cgpa,
        minimum_cgpa_throughout,
        allowed_branches,
        allowed_batches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *`,
      [
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        minimum_cgpa,
        minimum_cgpa_throughout ?? null,
        allowed_branches,
        allowed_batches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        req.user.userId,
      ]
    );

    const drive = result.rows[0];

    let createdAnnouncement = null;
    if (announcement) {
      const post = await insertAnnouncement(client, {
        title: announcement.title,
        content: announcement.content,
        postedBy: req.user.userId,
        driveId: drive.drive_id,
      });
      const attachments = await replaceAttachments(
        client,
        post.post_id,
        announcement.attachments ?? []
      );
      createdAnnouncement = { ...post, attachments };
    }

    await client.query("COMMIT");

    const eligibleStudents = await getEligibleStudentsForDrive(drive);

    // Notify every currently-eligible student that a new opportunity was posted.
    // Uses the pool (not `client`) since the transaction has already committed.
    if (eligibleStudents.length > 0) {
      const label = await getDriveLabel(pool, drive);
      await notifyStudentsByIds(
        pool,
        eligibleStudents.map((s) => s.id),
        "New drive posted",
        `A new opportunity - ${label} - has been posted and you're eligible. Check it out!`,
        "blue"
      );
    }

    // A drive-linked announcement is a separate, broader update - broadcast it
    // to every student, not just those eligible for this specific drive.
    if (createdAnnouncement) {
      await createNotificationForRole(
        "student",
        "New announcement",
        createdAnnouncement.title,
        "blue"
      );
    }

    return res.status(201).json({
      drive,
      eligibleStudents,
      announcement: createdAnnouncement,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to create drive");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

export const getDrives = async (req, res) => {
  try {
    // announcement_id exposes whether a drive has a linked announcement (and
    // which one) without the client fetching/matching all announcements. The
    // UNIQUE(drive_id) constraint guarantees at most one match per drive.
    const result = await pool.query(
      `SELECT d.*, cp.post_id AS announcement_id,
              cr.round_date AS current_round_date,
              cr.round_name AS current_round_name,
              COALESCE((
                SELECT COUNT(*)::int FROM drive_students ds
                WHERE ds.drive_id = d.drive_id
                  AND ds.status = 'ACTIVE'
                  AND ds.current_round = d.current_round
              ), 0) AS current_round_count
         FROM drives d
         LEFT JOIN company_posts cp ON cp.drive_id = d.drive_id
         LEFT JOIN drive_rounds cr
           ON cr.drive_id = d.drive_id AND cr.round_no = d.current_round
        ORDER BY d.created_at DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch drives");
    return res.status(status).json({ message });
  }
};

export const getDriveById = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT * FROM drives WHERE drive_id=$1`,
      [driveId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Drive not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch drive");
    return res.status(status).json({ message });
  }
};

// GET /drive/:driveId/eligible - regenerate the on-the-fly eligible-students list
// for an existing drive. This decouples shortlist review from drive creation: the
// admin can create a drive now and review/confirm its shortlist later. The list
// is computed fresh (never stored), same as the create/update responses.
export const getDriveEligible = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT * FROM drives WHERE drive_id = $1`,
      [driveId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Drive not found" });
    }

    const drive = result.rows[0];
    const eligibleStudents = await getEligibleStudentsForDrive(drive);

    return res.status(200).json({ drive, eligibleStudents });
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(
      error,
      "Failed to fetch eligible students"
    );
    return res.status(status).json({ message });
  }
};

// Editing a drive is only allowed during the SHORTLISTING phase. Once Round 0
// has started the drive is locked: eligibility criteria are immutable because
// the shortlist has already been sent to the company.
export const updateDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const existing = await pool.query(
      `SELECT is_locked FROM drives WHERE drive_id = $1`,
      [driveId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Drive not found" });
    }

    if (existing.rows[0].is_locked) {
      return res.status(409).json({
        message:
          "Drive is locked. Eligibility criteria cannot be changed after drive has been locked has started.",
      });
    }

    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      minimum_cgpa,
      minimum_cgpa_throughout,
      allowed_branches,
      allowed_batches,
      max_active_backlogs,
      max_passive_backlogs,
      number_of_rounds,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE drives
       SET company_id = $1,
           job_role = $2,
           job_description = $3,
           package_ctc = $4,
           employment_type = $5,
           minimum_cgpa = $6,
           minimum_cgpa_throughout = $7,
           allowed_branches = $8,
           allowed_batches = $9,
           max_active_backlogs = $10,
           max_passive_backlogs = $11,
           number_of_rounds = $12,
           status = $13,
           updated_at = NOW()
       WHERE drive_id = $14
       RETURNING *`,
      [
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        minimum_cgpa,
        minimum_cgpa_throughout ?? null,
        allowed_branches,
        allowed_batches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        status,
        driveId,
      ]
    );

    const drive = result.rows[0];

    // Editing eligibility invalidates the tentative shortlist; clear it so the
    // admin reviews and confirms a fresh eligible list.
    await pool.query(
      `DELETE FROM drive_students WHERE drive_id = $1`,
      [drive.drive_id]
    );

    const eligibleStudents = await getEligibleStudentsForDrive(drive);

    return res.status(200).json({
      message: "Drive updated. Previous shortlist removed.",
      drive,
      eligibleStudents,
    });
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to update drive");
    return res.status(status).json({ message });
  }
};

export const deleteDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `DELETE FROM drives WHERE drive_id=$1 RETURNING *`,
      [driveId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Drive not found" });
    }

    return res.status(200).json({
      message: "Drive deleted successfully",
    });
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to delete drive");
    return res.status(status).json({ message });
  }
};

// ---------------------------------------------------------------------------
// Shortlisting phase
// ---------------------------------------------------------------------------

// Persist (replace) the admin's chosen subset of the eligible list into
// drive_students. Only allowed while SHORTLISTING - re-confirming replaces the
// tentative shortlist. No history is written here; the permanent SHORTLIST rows
// are recorded at Start Round 0, once the shortlist is finalised.
export const confirmStudents = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students provided" });
    }

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (drive.drive_state !== "SHORTLISTING") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Shortlist is locked. Company screening has already started.",
      });
    }

    // Replace the whole shortlist so the confirm step is idempotent.
    await client.query(`DELETE FROM drive_students WHERE drive_id = $1`, [driveId]);

    for (const studentId of studentIds) {
      await client.query(
        `INSERT INTO drive_students
           (drive_id, student_id, status, current_round, added_by)
         VALUES ($1, $2, 'SHORTLISTED', -1, $3)`,
        [driveId, studentId, req.user.userId]
      );
    }

    // Notify every confirmed student that they've been shortlisted for the drive.
    const label = await getDriveLabel(client, drive);
    await notifyStudentsByIds(
      client,
      studentIds,
      "You've been shortlisted",
      `You have been shortlisted for ${label}. Watch for round schedules and updates.`,
      "green"
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Students confirmed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to confirm students");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

export const getDriveStudents = async (req, res) => {
  try {

    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT
          ds.drive_student_id,
          ds.current_round,
          ds.status,
          ds.attendance_mark,
          ds.remarks,

          s.id,
          s.roll_no,
          s.name,
          s.email,
          s.branch,
          s.cgpa

        FROM drive_students ds
        JOIN students s ON ds.student_id = s.id
        WHERE ds.drive_id = $1
        ORDER BY s.cgpa DESC`,
      [driveId]
    );

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);
    const { status, message } = pgErrorResponse(
      error,
      "Failed to fetch drive students"
    );
    return res.status(status).json({ message });
  }
};

// ---------------------------------------------------------------------------
// Round-workflow transitions
// ---------------------------------------------------------------------------

// Start Round 0 = finalise the shortlist and send it to the company. Locks the
// drive, moves every confirmed student to ACTIVE at round 0, and writes the
// permanent SHORTLIST history rows.
export const startRoundZero = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (drive.drive_state !== "SHORTLISTING") {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Company screening has already started." });
    }

    const students = await client.query(
      `SELECT student_id FROM drive_students WHERE drive_id = $1`,
      [driveId]
    );

    if (students.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Confirm at least one student before company screening.",
      });
    }

    await client.query(
      `UPDATE drive_students
         SET status = 'ACTIVE', current_round = 0
       WHERE drive_id = $1`,
      [driveId]
    );

    for (const { student_id } of students.rows) {
      await recordHistory(client, {
        driveId,
        studentId: student_id,
        roundNo: 0,
        stage: "SHORTLIST",
        result: "SHORTLISTED",
        recordedBy: req.user.userId,
      });
    }

    // Round 0 (the company screening) owns a date row too (TBD until scheduled).
    // Confirming the screening is what STARTS it, so stamp started_at now.
    await client.query(
      `INSERT INTO drive_rounds (drive_id, round_no, started_at)
       VALUES ($1, 0, NOW())
       ON CONFLICT (drive_id, round_no)
       DO UPDATE SET started_at = COALESCE(drive_rounds.started_at, NOW())`,
      [driveId]
    );

    const updated = await client.query(
      `UPDATE drives
         SET is_locked = TRUE,
             current_round = 0,
             drive_state = 'ROUND_IN_PROGRESS',
             round_stage = 'RESULT',
             status = 'ongoing',
             updated_at = NOW()
       WHERE drive_id = $1
       RETURNING *`,
      [driveId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Company screening started. Shortlist locked.",
      drive: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to confirm for company screening");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

// Close the pre-filter stage (rounds >= 1) and open attendance. The checkbox UI
// keeps decisions local until here, then commits the whole `removed` set at once:
// each listed (still-active) student is marked REMOVED with its reason + history,
// everyone left checked stays ACTIVE, and the removed students are notified.
export const finalizePrefilter = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;
    const { removed = [] } = req.body;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (
      drive.drive_state !== "ROUND_IN_PROGRESS" ||
      drive.round_stage !== "PREFILTER" ||
      drive.current_round < 1
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Drive is not in the pre-filter stage.",
      });
    }

    // Batch-commit the removals for the current round. Non-active rows are skipped
    // so the operation is idempotent if the same finalize is retried.
    const removedIds = [];
    for (const { driveStudentId, reason } of removed) {
      const student = await loadDriveStudent(client, driveStudentId, driveId);
      if (!student || student.status !== "ACTIVE") continue;

      await client.query(
        `UPDATE drive_students SET status = 'REMOVED', remarks = $2 WHERE drive_student_id = $1`,
        [driveStudentId, reason]
      );
      await recordHistory(client, {
        driveId,
        studentId: student.student_id,
        roundNo: drive.current_round,
        stage: "PREFILTER",
        result: "REMOVED",
        reason,
        recordedBy: req.user.userId,
      });
      removedIds.push(student.student_id);
    }

    // Notify the students removed during this round's pre-filter.
    if (removedIds.length > 0) {
      const label = await getDriveLabel(client, drive);
      await notifyStudentsByIds(
        client,
        removedIds,
        "Removed from a drive round",
        `You have been removed before ${roundText(drive.current_round)} of ${label} and are no longer progressing in this drive.`,
        "red"
      );
    }

    const updated = await client.query(
      `UPDATE drives
         SET round_stage = 'ATTENDANCE', updated_at = NOW()
       WHERE drive_id = $1
       RETURNING *`,
      [driveId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Pre-filter finalised. Attendance is now open.",
      drive: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(
      error,
      "Failed to finalise pre-filter"
    );
    return res.status(status).json({ message });
  } finally {
    client.release();
  }

};

// Close attendance: everyone defaults to PRESENT (checkbox model) - only students
// explicitly marked ABSENT drop out. Each mark is written to history in one batch
// and absentees are notified.
export const finalizeAttendance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (
      drive.drive_state !== "ROUND_IN_PROGRESS" ||
      drive.round_stage !== "ATTENDANCE"
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Drive is not in the attendance stage.",
      });
    }

    // A round may not proceed past attendance until its date is set. (Round 0 is
    // exempt, but it never reaches the attendance stage.)
    const dateRow = await client.query(
      `SELECT round_date FROM drive_rounds WHERE drive_id = $1 AND round_no = $2`,
      [driveId, drive.current_round]
    );
    if (!dateRow.rows[0] || dateRow.rows[0].round_date == null) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Set this round's date before finalising attendance.",
      });
    }

    const active = await client.query(
      `SELECT drive_student_id, student_id, attendance_mark
         FROM drive_students
        WHERE drive_id = $1 AND status = 'ACTIVE'
        FOR UPDATE`,
      [driveId]
    );

    const absentIds = [];
    for (const row of active.rows) {
      // Checkbox model: only an explicit 'ABSENT' mark counts as absent;
      // everyone else (marked PRESENT or left unmarked) is present.
      const isAbsent = row.attendance_mark === "ABSENT";
      if (isAbsent) {
        await client.query(
          `UPDATE drive_students SET status = 'ABSENT' WHERE drive_student_id = $1`,
          [row.drive_student_id]
        );
        absentIds.push(row.student_id);
      }
      await recordHistory(client, {
        driveId,
        studentId: row.student_id,
        roundNo: drive.current_round,
        stage: "ATTENDANCE",
        result: isAbsent ? "ABSENT" : "PRESENT",
        recordedBy: req.user.userId,
      });
    }

    if (absentIds.length > 0) {
      const label = await getDriveLabel(client, drive);
      await notifyStudentsByIds(
        client,
        absentIds,
        "Marked absent",
        `You were marked absent for ${roundText(drive.current_round)} of ${label} and are no longer in the process.`,
        "red"
      );
    }

    const updated = await client.query(
      `UPDATE drives
         SET round_stage = 'RESULT', updated_at = NOW()
       WHERE drive_id = $1
       RETURNING *`,
      [driveId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Attendance finalised. Record results now.",
      drive: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(
      error,
      "Failed to finalise attendance"
    );
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

// Advance out of the RESULT stage into a fresh next round. The number of rounds
// is NOT fixed up front - the admin runs another round with `advance-round` or
// ends the drive with `complete`. Selected students carry forward as ACTIVE.
export const advanceRound = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (
      drive.drive_state !== "ROUND_IN_PROGRESS" ||
      drive.round_stage !== "RESULT"
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Drive is not in the results stage.",
      });
    }

    // Batch-resolve the round from the checkbox decisions: unchecked students
    // (in `rejected`, each with a reason) become REJECTED; everyone still active
    // clears the round as SELECTED. Both are written to history now.
    const selectedCount = await resolveRoundResults(client, drive, req.body.rejected ?? [], req.user.userId);

    if (selectedCount === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "At least one student must clear the round to run another round, or complete the drive.",
      });
    }

    // Publish results to everyone who reached this round's results: selected
    // students progress, rejected students are eliminated.
    await notifyRoundResults(client, drive);

    // Carry the selected students into the next round as ACTIVE and reset the
    // transient attendance marks.
    const nextRound = drive.current_round + 1;

    await client.query(
      `UPDATE drive_students
         SET status = 'ACTIVE', current_round = $2, attendance_mark = NULL
       WHERE drive_id = $1 AND status = 'SELECTED'`,
      [driveId, nextRound]
    );

    // Running the next round CONCLUDES the round just resolved...
    await client.query(
      `INSERT INTO drive_rounds (drive_id, round_no, concluded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (drive_id, round_no)
       DO UPDATE SET concluded_at = COALESCE(drive_rounds.concluded_at, NOW())`,
      [driveId, drive.current_round]
    );

    // ...and STARTS the new one (with a TBD date until scheduled).
    await client.query(
      `INSERT INTO drive_rounds (drive_id, round_no, started_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (drive_id, round_no)
       DO UPDATE SET started_at = COALESCE(drive_rounds.started_at, NOW())`,
      [driveId, nextRound]
    );

    const updated = await client.query(
      `UPDATE drives
         SET current_round = $2,
             round_stage = 'PREFILTER',
             updated_at = NOW()
       WHERE drive_id = $1
       RETURNING *`,
      [driveId, nextRound]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: `Advanced to Round ${nextRound}.`,
      drive: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to advance round");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

// Complete the drive from the RESULT stage: every SELECTED student becomes PLACED
// (and their placement_status flipped so future eligibility excludes them), and
// the drive is closed. Available at any round, including Round 0 (screening-only).
export const completeDrive = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId } = req.params;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (
      drive.drive_state !== "ROUND_IN_PROGRESS" ||
      drive.round_stage !== "RESULT"
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Drive is not in the results stage.",
      });
    }

    // Batch-resolve from the checkbox decisions: unchecked students become
    // REJECTED (with reason + history); everyone still active becomes SELECTED
    // and is placed below.
    await resolveRoundResults(client, drive, req.body.rejected ?? [], req.user.userId);

    // Publish results before placing: selected -> placed (congrats), rejected -> out.
    await notifyRoundResults(client, drive, { final: true });

    const selected = await client.query(
      `SELECT ds.drive_student_id, ds.student_id, st.placement_status
         FROM drive_students ds
         JOIN students st ON st.id = ds.student_id
        WHERE ds.drive_id = $1 AND ds.status = 'SELECTED'
        FOR UPDATE OF ds`,
      [driveId]
    );

    const placement = isPlacementDrive(drive.employment_type);

    for (const row of selected.rows) {
      await client.query(
        `UPDATE drive_students SET status = 'PLACED' WHERE drive_student_id = $1`,
        [row.drive_student_id]
      );

      if (!placement) {
        // Internship (incl. Internship+PPO while treated as internship): only
        // the independent flag is set; placement state is untouched.
        await client.query(
          `UPDATE students SET selected_for_internship = TRUE WHERE id = $1`,
          [row.student_id]
        );
      } else if (row.placement_status === "placed") {
        // An already-placed student winning a >=2x drive uses their one second
        // chance: terminal state, package updated to the new offer.
        await client.query(
          `UPDATE students
              SET placement_status = 'second_chance', placed_package = $2
            WHERE id = $1`,
          [row.student_id, drive.package_ctc ?? null]
        );
      } else {
        await client.query(
          `UPDATE students
              SET placement_status = 'placed', placed_package = $2
            WHERE id = $1`,
          [row.student_id, drive.package_ctc ?? null]
        );
      }

      await recordHistory(client, {
        driveId,
        studentId: row.student_id,
        roundNo: drive.current_round,
        stage: "RESULT",
        result: "PLACED",
        recordedBy: req.user.userId,
      });
    }

    // Completing the drive CONCLUDES the final round.
    await client.query(
      `INSERT INTO drive_rounds (drive_id, round_no, concluded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (drive_id, round_no)
       DO UPDATE SET concluded_at = COALESCE(drive_rounds.concluded_at, NOW())`,
      [driveId, drive.current_round]
    );

    const updated = await client.query(
      `UPDATE drives
         SET drive_state = 'COMPLETED',
             round_stage = NULL,
             status = 'completed',
             number_of_rounds = $2,
             updated_at = NOW()
       WHERE drive_id = $1
       RETURNING *`,
      [driveId, drive.current_round]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: `Drive completed. ${selected.rows.length} student(s) ${placement ? "placed" : "selected for the internship"}.`,
      drive: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to complete drive");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// Per-student round actions
// ---------------------------------------------------------------------------

// Set a student's attendance mark (rounds >= 1). Transient - no status change or
// history until finalize-attendance batches it.
export const markAttendance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId, driveStudentId } = req.params;
    const { present } = req.body;

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (
      drive.drive_state !== "ROUND_IN_PROGRESS" ||
      drive.round_stage !== "ATTENDANCE"
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Drive is not in the attendance stage.",
      });
    }

    const student = await loadDriveStudent(client, driveStudentId, driveId);

    if (!student) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found in this drive" });
    }

    if (student.status !== "ACTIVE") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Attendance can only be marked for active students.",
      });
    }

    await client.query(
      `UPDATE drive_students SET attendance_mark = $2 WHERE drive_student_id = $1`,
      [driveStudentId, present ? "PRESENT" : "ABSENT"]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: present ? "Marked present." : "Marked absent.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to mark attendance");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};


// ---------------------------------------------------------------------------
// Student-facing (self-scoped) reads
// ---------------------------------------------------------------------------

// The drives the current student has been shortlisted into, with the student's
// OWN status and round. Resolved from users.id -> students.user_id, so a student
// only ever sees their own drives.
export const getMyDrives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          d.*,
          ds.status        AS my_status,
          ds.current_round AS my_current_round,
          cp.post_id       AS announcement_id,
          cr.round_date    AS current_round_date,
          cr.round_name    AS current_round_name,
          COALESCE((
            SELECT COUNT(*)::int FROM drive_students dss
            WHERE dss.drive_id = d.drive_id
              AND dss.status = 'ACTIVE'
              AND dss.current_round = d.current_round
          ), 0) AS current_round_count
       FROM drive_students ds
       JOIN drives d   ON ds.drive_id = d.drive_id
       JOIN students s ON ds.student_id = s.id
       LEFT JOIN company_posts cp ON cp.drive_id = d.drive_id
       LEFT JOIN drive_rounds cr
         ON cr.drive_id = d.drive_id AND cr.round_no = d.current_round
       WHERE s.user_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch your drives");
    return res.status(status).json({ message });
  }
};

// The current student's OWN round-by-round history for one drive. Filtered by
// the resolved student id, so a student can never see another student's results.
export const getMyDriveResults = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT
          h.history_id,
          h.round_no,
          h.stage,
          h.result,
          h.reason,
          h.recorded_at
       FROM drive_round_history h
       JOIN students s ON h.student_id = s.id
       WHERE h.drive_id = $1 AND s.user_id = $2
       ORDER BY h.round_no, h.recorded_at`,
      [driveId, req.user.userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch your results");
    return res.status(status).json({ message });
  }
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

// The permanent per-round audit trail. `round` query param filters to one round;
// omit it for the whole drive. Grouping (reached / removed / present / absent /
// selected / rejected / placed) is left to the caller.
export const getRoundHistory = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { round } = req.query;

    const params = [driveId];
    let where = `h.drive_id = $1`;

    if (round !== undefined && round !== "") {
      params.push(Number(round));
      where += ` AND h.round_no = $2`;
    }

    const result = await pool.query(
      `SELECT
          h.history_id,
          h.student_id,
          h.round_no,
          h.stage,
          h.result,
          h.reason,
          h.recorded_at,
          s.name,
          s.roll_no,
          s.branch
        FROM drive_round_history h
        JOIN students s ON h.student_id = s.id
        WHERE ${where}
        ORDER BY h.round_no, h.recorded_at, s.name`,
      params
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(
      error,
      "Failed to fetch drive history"
    );
    return res.status(status).json({ message });
  }
};

// ---------------------------------------------------------------------------
// Per-round dates
// ---------------------------------------------------------------------------

// Every round of a drive with its date (NULL = TBD). Available to any authed user
// so students can see when their round is scheduled.
export const getDriveRounds = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT round_no, round_date, round_name, started_at, concluded_at
         FROM drive_rounds
        WHERE drive_id = $1
        ORDER BY round_no`,
      [driveId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch drive rounds");
    return res.status(status).json({ message });
  }
};

// Set (or clear) a round's date. Setting a real date notifies the students still
// active in that round that it has been scheduled.
export const setRoundDate = async (req, res) => {
  const client = await pool.connect();

  try {
    const { driveId, roundNo } = req.params;
    const { round_date, round_name } = req.body;
    const date = dateOrNull(round_date);
    const name = round_name && round_name.trim() ? round_name.trim() : null;
    const round = Number(roundNo);

    await client.query("BEGIN");

    const drive = await loadDriveForUpdate(client, driveId);

    if (!drive) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Drive not found" });
    }

    if (!Number.isInteger(round) || round < 0 || round > drive.current_round) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "That round does not exist for this drive." });
    }

    await client.query(
      `INSERT INTO drive_rounds (drive_id, round_no, round_date, round_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (drive_id, round_no)
       DO UPDATE SET round_date = EXCLUDED.round_date,
                     round_name = EXCLUDED.round_name`,
      [driveId, round, date, name]
    );

    // Only notify when an actual date is set (not when cleared to TBD).
    if (date) {
      const active = await client.query(
        `SELECT student_id FROM drive_students
          WHERE drive_id = $1 AND current_round = $2 AND status = 'ACTIVE'`,
        [driveId, round]
      );
      if (active.rows.length > 0) {
        const label = await getDriveLabel(client, drive);
        await notifyStudentsByIds(
          client,
          active.rows.map((r) => r.student_id),
          "Round scheduled",
          `${roundTextCap(round)} of ${label} is scheduled for ${date}. Please check your dashboard for details.`,
          "blue"
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({ message: "Round date updated." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to update round date");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};
