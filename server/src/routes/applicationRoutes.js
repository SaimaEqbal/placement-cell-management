import express from "express";

import {
  getApplications,
  createApplication,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/", getApplications);
router.get("/:id",getApplicationById);
router.post("/", createApplication);
router.put("/:id/status",updateApplicationStatus);
router.delete("/:id",deleteApplication);

export default router;