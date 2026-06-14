import pool from "../config/db.js";

export const createCompany = async (req, res) => {
  try {
    const {
      company_name,
      industry,
      description,
      hr_name,
      hr_email,
      hr_phone,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO companies
      (
        company_name,
        industry,
        description,
        hr_name,
        hr_email,
        hr_phone,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        company_name,
        industry,
        description,
        hr_name,
        hr_email,
        hr_phone,
        req.user.userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create company",
    });
  }
};


export const getCompanies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM companies
       ORDER BY company_id DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch companies",
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM companies
       WHERE company_id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch company",
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const {
      company_name,
      industry,
      description,
      hr_name,
      hr_email,
      hr_phone,
    } = req.body;

    const result = await pool.query(
      `UPDATE companies
       SET company_name = $1,
           industry = $2,
           description = $3,
           hr_name = $4,
           hr_email = $5,
           hr_phone = $6
       WHERE company_id = $7
       RETURNING *`,
      [
        company_name,
        industry,
        description,
        hr_name,
        hr_email,
        hr_phone,
        companyId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update company",
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await pool.query(
      `DELETE FROM companies
       WHERE company_id = $1
       RETURNING *`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    return res.status(200).json({
      message: "Company deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete company",
    });
  }
};