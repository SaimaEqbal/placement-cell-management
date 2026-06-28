import express from "express";

import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  uploadAttachments,
  getAttachmentsByPost,
  deleteAttachment,
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

router.post(
  "/:postId/attachments",
  auth,
  requireAdmin,
  uploadAttachments
);

router.get(
  "/:postId/attachments",
  auth,
  getAttachmentsByPost
);

router.delete(
  "/attachments/:attachmentId",
  auth,
  requireAdmin,
  deleteAttachment
);

export default router;