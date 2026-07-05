import pool from "../config/db.js";

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
        AND placement_status = 'unplaced'
        AND cgpa >= $1
        AND active_backlogs <= $2
        AND passive_backlogs <= $3
        AND branch = ANY($4)
     ORDER BY cgpa DESC`,
    [
      drive.minimum_cgpa,
      drive.max_active_backlogs,
      drive.max_passive_backlogs,
      drive.allowed_branches,
    ]
  );

  return result.rows;
}

export const createDrive = async (req, res) => {
  try {
    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      drive_date,
      application_deadline,
      minimum_cgpa,
      allowed_branches,
      max_active_backlogs,
      max_passive_backlogs,
      number_of_rounds,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO drives (
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
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
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        req.user.userId,
      ]
    );

    const drive = result.rows[0];

    const eligibleStudents =
      await getEligibleStudentsForDrive(drive);

    return res.status(201).json({
      drive,
      eligibleStudents,
    });
  } catch {
    return res.status(500).json({ message: "Failed to create drive" });
  }
};

export const getDrives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drives ORDER BY drive_date DESC`
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Failed to fetch drives" });
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
  } catch {
    return res.status(500).json({ message: "Failed to fetch drive" });
  }
};

export const updateDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      drive_date,
      application_deadline,
      minimum_cgpa,
      allowed_branches,
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
           drive_date = $6,
           application_deadline = $7,
           minimum_cgpa = $8,
           allowed_branches = $9,
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
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        status,
        driveId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Drive not found",
      });
    }

    const drive = result.rows[0];
    await pool.query(
      `DELETE FROM drive_students
      WHERE drive_id = $1`,
      [drive.drive_id]
    );

    const eligibleStudents =
      await getEligibleStudentsForDrive(drive);

    return res.status(200).json({
      message:
        "Drive updated. Previous shortlist removed.",

      drive,

      eligibleStudents,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update drive",
    });
  }
};

export const deleteDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    await pool.query(
      `DELETE FROM drives WHERE drive_id=$1`,
      [driveId]
    );

    return res.status(200).json({
      message: "Drive deleted successfully",
    });
  } catch {
    return res.status(500).json({ message: "Failed to delete drive" });
  }
};

// export const getAppliedStudents = async (req, res) => {
//   try {
//     const { driveId } = req.params;

//     const result = await pool.query(
//       `SELECT
//           a.*,
//           s.name,
//           s.email,
//           s.roll_no,
//           s.branch,
//           s.cgpa
//        FROM applications a
//        JOIN students s
//        ON a.student_id = s.id
//        WHERE a.drive_id = $1`,
//       [driveId]
//     );

//     return res.status(200).json(result.rows);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to fetch applicants",
//     });
//   }
// };

// export const approveApplication = async (req, res) => {
//   try {
//     const { applicationId } = req.params;

//     const result = await pool.query(
//       `UPDATE applications
//        SET status='approved'
//        WHERE application_id=$1
//        RETURNING *`,
//       [applicationId]
//     );

//     return res.status(200).json(result.rows[0]);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to approve application",
//     });
//   }
// };

// export const rejectApplication = async (req, res) => {
//   try {
//     const { applicationId } = req.params;

//     const result = await pool.query(
//       `UPDATE applications
//        SET status='rejected'
//        WHERE application_id=$1
//        RETURNING *`,
//       [applicationId]
//     );

//     return res.status(200).json(result.rows[0]);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to reject application",
//     });
//   }
// };

// export const markStudentSelected = async (req, res) => {
//   try {
//     const { applicationId } = req.params;

//     const result = await pool.query(
//       `UPDATE applications
//        SET status='selected'
//        WHERE application_id=$1
//        RETURNING *`,
//       [applicationId]
//     );

//     return res.status(200).json(result.rows[0]);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to mark selected",
//     });
//   }
// };

// export const markStudentRejected = async (req, res) => {
//   try {
//     const { applicationId } = req.params;

//     const result = await pool.query(
//       `UPDATE applications
//        SET status='not_selected'
//        WHERE application_id=$1
//        RETURNING *`,
//       [applicationId]
//     );

//     return res.status(200).json(result.rows[0]);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to mark rejected",
//     });
//   }
// };

// export const getDriveResults = async (req, res) => {
//   try {
//     const { driveId } = req.params;

//     const result = await pool.query(
//       `SELECT
//           s.name,
//           s.roll_no,
//           s.branch,
//           a.current_round,
//           a.status
//        FROM applications a
//        JOIN students s
//        ON a.student_id = s.id
//        WHERE a.drive_id = $1
//        ORDER BY s.name`,
//       [driveId]
//     );

//     return res.status(200).json(result.rows);
//   } catch {
//     return res.status(500).json({
//       message: "Failed to fetch results",
//     });
//   }
// };

export const confirmStudents = async (
  req,
  res
) => {

  const client = await pool.connect();

  try {

    const { driveId } = req.params;

    const { studentIds } = req.body;

    await client.query("BEGIN");

    for (const studentId of studentIds) {

      await client.query(
        `INSERT INTO drive_students
        (
            drive_id,
            student_id,
            added_by
        )
        VALUES
        ($1,$2,$3)`,
        [
          driveId,
          studentId,
          req.user.userId,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message:
        "Students confirmed successfully",
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      message:
        "Failed to confirm students",
    });

  } finally {

    client.release();

  }
};

export const getDriveStudents = async (
  req,
  res
) => {

  try {

    const { driveId } = req.params;

    const result =
      await pool.query(
        `SELECT
            ds.drive_student_id,
            ds.current_round,
            ds.status,
            ds.remarks,

            s.id,
            s.roll_no,
            s.name,
            s.email,
            s.branch,
            s.cgpa

        FROM drive_students ds

        JOIN students s
        ON ds.student_id=s.id

        WHERE ds.drive_id=$1

        ORDER BY s.cgpa DESC`,
        [driveId]
      );

    return res.status(200).json(
      result.rows
    );

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message:
        "Failed to fetch drive students",
    });

  }

};

export const updateStudentRound =
  async (req, res) => {

    try {

      const { driveStudentId } = req.params;

      const { current_round } = req.body;

      const result = await pool.query(

        `UPDATE drive_students

SET current_round=$1

WHERE drive_student_id=$2

RETURNING *`,

        [current_round, driveStudentId]

      );

      if (result.rows.length === 0) {

        return res.status(404).json({

          message: "Student not found"

        });

      }

      return res.status(200).json(result.rows[0]);

    } catch (error) {

      console.error(error);

      return res.status(500).json({

        message: "Failed to update round"

      });

    }

  };

export const markSelected =
  async (req, res) => {

    try {

      const { driveStudentId } = req.params;

      const result = await pool.query(

        `UPDATE drive_students

SET status='selected'

WHERE drive_student_id=$1

RETURNING *`,

        [driveStudentId]

      );

      if (result.rows.length === 0) {

        return res.status(404).json({

          message: "Student not found"

        });

      }

      return res.status(200).json(result.rows[0]);

    } catch (error) {

      console.error(error);

      return res.status(500).json({

        message: "Failed to update status"

      });

    }

  };

export const markRejected =
  async (req, res) => {

    try {

      const { driveStudentId } = req.params;

      const result = await pool.query(

        `UPDATE drive_students

SET status='not_selected'

WHERE drive_student_id=$1

RETURNING *`,

        [driveStudentId]

      );

      if (result.rows.length === 0) {

        return res.status(404).json({

          message: "Student not found"

        });

      }

      return res.status(200).json(result.rows[0]);

    } catch (error) {

      console.error(error);

      return res.status(500).json({

        message: "Failed to update status"

      });

    }

  };

export const removeStudent =
  async (req, res) => {

    try {

      const { driveStudentId } = req.params;

      const result = await pool.query(

        `DELETE FROM drive_students

WHERE drive_student_id=$1

RETURNING *`,

        [driveStudentId]

      );

      if (result.rows.length === 0) {

        return res.status(404).json({

          message: "Student not found"

        });

      }

      return res.status(200).json({

        message:

          "Student removed successfully"

      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({

        message:

          "Failed to remove student"

      });

    }

  };