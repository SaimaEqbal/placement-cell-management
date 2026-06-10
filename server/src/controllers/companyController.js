// import pool from "../config/db.js";

// export const getCompanies = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM companies ORDER BY id"
//     );

//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to fetch companies",
//     });
//   }
// };

// export const getCompanyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       "SELECT * FROM companies WHERE id = $1",
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "Company not found",
//       });
//     }

//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to fetch company",
//     });
//   }
// };

// export const createCompany = async (req, res) => {
//   try {
//     const {
//       name,
//       job_role,
//       package_lpa,
//       minimum_cgpa,
//       allowed_branches,
//       backlog_allowed,
//       job_type,
//       drive_date,
//       application_deadline,
//       location,
//     } = req.body;

//     const result = await pool.query(
//       `INSERT INTO companies
//       (
//         name,
//         job_role,
//         package_lpa,
//         minimum_cgpa,
//         allowed_branches,
//         backlog_allowed,
//         job_type,
//         drive_date,
//         application_deadline,
//         location
//       )
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//       RETURNING *`,
//       [
//         name,
//         job_role,
//         package_lpa,
//         minimum_cgpa,
//         allowed_branches,
//         backlog_allowed,
//         job_type,
//         drive_date,
//         application_deadline,
//         location,
//       ]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to create company",
//     });
//   }
// };

// export const updateCompany = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       name,
//       job_role,
//       package_lpa,
//       minimum_cgpa,
//       allowed_branches,
//       backlog_allowed,
//       job_type,
//       drive_date,
//       application_deadline,
//       location,
//     } = req.body;

//     const result = await pool.query(
//       `UPDATE companies
//        SET
//          name = $1,
//          job_role = $2,
//          package_lpa = $3,
//          minimum_cgpa = $4,
//          allowed_branches = $5,
//          backlog_allowed = $6,
//          job_type = $7,
//          drive_date = $8,
//          application_deadline = $9,
//          location = $10
//        WHERE id = $11
//        RETURNING *`,
//       [
//         name,
//         job_role,
//         package_lpa,
//         minimum_cgpa,
//         allowed_branches,
//         backlog_allowed,
//         job_type,
//         drive_date,
//         application_deadline,
//         location,
//         id,
//       ]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "Company not found",
//       });
//     }

//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to update company",
//     });
//   }
// };

// export const deleteCompany = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       "DELETE FROM companies WHERE id = $1 RETURNING *",
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "Company not found",
//       });
//     }

//     res.status(200).json({
//       message: "Company deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Failed to delete company",
//     });
//   }
// };