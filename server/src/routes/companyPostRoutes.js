import express from "express";

import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/companyPostController.js";

import {
  validateCreateCompanyPost,
  validateUpdateCompanyPost,
} from "../middleware/companyPostMiddleware.js";

import {
    requireAdmin
} from "../middleware/roleMiddleware.js";

import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  auth,
  validateCreateCompanyPost,
  requireAdmin,
  createPost
);

router.get(
  "/",
  auth,
  getPosts
);

router.get(
  "/:postId",
  auth,
  getPostById
);

router.put(
  "/:postId",
  auth,
  validateUpdateCompanyPost,
  requireAdmin,
  updatePost
);

router.delete(
  "/:postId",
  auth,
  requireAdmin,
  deletePost
);

// Attachments are managed transactionally through the post create/update bodies
// (they are pasted Drive links, not uploads), so there are no separate
// attachment routes.

export default router;