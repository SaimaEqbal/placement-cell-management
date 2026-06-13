import express from "express";
import { updateStudent } from "../controllers/studentController.js";
import {auth} from "../middleware/authMiddleware.js";
import { requireSPC } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.put("/:id",auth,requireSPC,updateStudent);

export default router;
