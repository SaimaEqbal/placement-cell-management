import express from "express";
import { validateCreateTPC,validateUpdateTPC } from "../middleware/tpcMiddleware.js";
import {auth} from "../middleware/authMiddleware.js";
import { requireTPC,requireAdmin,requireAdminTPC } from "../middleware/roleMiddleware.js";
import {
  getAllTPCs,
  createTPC,
  updateTPC,
  deleteTPC,
  promoteSPC,
  demoteSPC,
} from "../controllers/tpcController.js";

const router = express.Router();

router.get("/",auth,requireAdmin,getAllTPCs);
router.post("/",auth,requireAdmin,validateCreateTPC,createTPC);
router.put("/:tpcId",auth,requireAdminTPC,validateUpdateTPC,updateTPC);

router.delete("/:tpcId",auth,requireAdmin,deleteTPC);

router.put("/promote-spc/:studentId",auth,requireTPC,promoteSPC);

router.put("/demote-spc/:studentId",auth,requireTPC,demoteSPC);

export default router;