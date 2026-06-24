import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin} from "../middleware/roleMiddleware.js";
import { validateCreateCompany,validateUpdateCompany } from "../middleware/companyMiddleware.js";
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.get("/",auth,getCompanies);
router.get("/:id",auth,getCompanyById);

router.post("/",auth,requireAdmin,validateCreateCompany,createCompany);

router.put("/:id",auth,requireAdmin,validateUpdateCompany,updateCompany);

router.delete("/:id",auth,requireAdmin,deleteCompany);

export default router;