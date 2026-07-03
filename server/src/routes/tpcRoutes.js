import express from "express";
import { validateCreateTPC, validateUpdateTPC } from "../middleware/tpcMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin, requireAdminTPC } from "../middleware/roleMiddleware.js";
import {
  getAllTPCs,
  createTPC,
  updateTPC,
  deleteTPC,
  promoteSPC,
  demoteSPC,
  getTpcStudents,
  getTpcQueue,
  getTpcSpcVerified,
  getTpcBranches,
  getTpcSpcs,
  assignStudentsToSpc,
  tpcVerifyStudent,
  tpcRejectStudent,
} from "../controllers/tpcController.js";

const router = express.Router();

// Admin management of TPC accounts
router.get("/", auth, requireAdmin, getAllTPCs);
router.post("/", auth, requireAdmin, validateCreateTPC, createTPC);

// TPC verification pipeline (static paths declared before the /:tpcId params so
// they are matched first).
router.get("/students", auth, requireAdminTPC, getTpcStudents);
router.get("/verification-queue", auth, requireAdminTPC, getTpcQueue);
router.get("/spc-verified", auth, requireAdminTPC, getTpcSpcVerified);
router.get("/branches", auth, requireAdminTPC, getTpcBranches);
router.get("/spcs", auth, requireAdminTPC, getTpcSpcs);
router.post("/assign-spc", auth, requireAdminTPC, assignStudentsToSpc);
router.put("/verify/:studentId", auth, requireAdminTPC, tpcVerifyStudent);
router.put("/reject/:studentId", auth, requireAdminTPC, tpcRejectStudent);

router.put("/promote-spc/:studentId", auth, requireAdminTPC, promoteSPC);
router.put("/demote-spc/:studentId", auth, requireAdminTPC, demoteSPC);

router.put("/:tpcId", auth, requireAdminTPC, validateUpdateTPC, updateTPC);
router.delete("/:tpcId", auth, requireAdmin, deleteTPC);

export default router;
