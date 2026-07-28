/**
 * Reserve one verification slot for a student cohort and return its SPC id.
 *
 * The caller remains responsible for writing students.assigned_spc_id.  The
 * reservation and capacity increment happen together so concurrent lifecycle
 * events cannot exceed an SPC's configured assignment limit.
 */
export const assignStudentToSpc = async (client, branch, semester) => {
  if (!branch || semester == null) return null;

  const result = await client.query(
    `WITH available_spc AS (
       SELECT s.spc_id
       FROM spc s
       JOIN students coordinator ON coordinator.user_id = s.user_id
       WHERE s.branch = $1
         AND coordinator.semester = $2
         AND s.active_verification_count < s.max_active_assignments
       ORDER BY s.active_verification_count ASC, s.spc_id ASC
       LIMIT 1
       FOR UPDATE OF s SKIP LOCKED
     )
     UPDATE spc s
     SET active_verification_count = s.active_verification_count + 1
     FROM available_spc candidate
     WHERE s.spc_id = candidate.spc_id
       AND s.active_verification_count < s.max_active_assignments
     RETURNING s.spc_id`,
    [branch, semester]
  );

  return result.rows.length ? result.rows[0].spc_id : null;
};

/**
 * Fill one available slot on a specific SPC with the oldest eligible student
 * from that SPC's branch and semester cohort.
 */
export const fillVerificationSlot = async (client, spcId) => {
  const spc = await client.query(
    `SELECT s.branch, coordinator.semester
     FROM spc s
     JOIN students coordinator ON coordinator.user_id = s.user_id
     WHERE s.spc_id = $1
       AND s.active_verification_count < s.max_active_assignments
     FOR UPDATE OF s`,
    [spcId]
  );

  if (spc.rows.length === 0 || spc.rows[0].semester == null) return false;

  const student = await client.query(
    `SELECT student.id
     FROM students student
     WHERE student.assigned_spc_id IS NULL
       AND student.review_status = 'pending'
       AND student.branch = $1
       AND student.semester = $2
       AND student.is_profile_complete = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM spc coordinator WHERE coordinator.user_id = student.user_id
       )
     ORDER BY student.created_at ASC, student.id ASC
     LIMIT 1
     FOR UPDATE OF student SKIP LOCKED`,
    [spc.rows[0].branch, spc.rows[0].semester]
  );

  if (student.rows.length === 0) return false;

  await client.query(
    `UPDATE students
     SET assigned_spc_id = $1
     WHERE id = $2`,
    [spcId, student.rows[0].id]
  );
  await client.query(
    `UPDATE spc
     SET active_verification_count = active_verification_count + 1
     WHERE spc_id = $1`,
    [spcId]
  );

  return true;
};
