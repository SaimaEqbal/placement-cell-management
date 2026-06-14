import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { requireAdminTPC} from "../middleware/roleMiddleware.js";
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

router.post("/",auth,requireAdminTPC,validateCreateCompany,createCompany);

router.put("/:id",auth,requireAdminTPC,validateUpdateCompany,updateCompany);

router.delete("/:id",auth,requireAdminTPC,deleteCompany);

export default router;