import express from "express";

import { auth } from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Every route here is scoped to req.user.userId inside the controller, so
// any authenticated role (student/spc/tpc/admin) only ever sees or touches
// their own notifications - no role middleware needed on top of `auth`.

router.get(
  "/",
  auth,
  getMyNotifications
);

router.patch(
  "/read-all",
  auth,
  markAllNotificationsRead
);

router.patch(
  "/:notificationId/read",
  auth,
  markNotificationRead
);

// Must be registered before "/:notificationId" below, otherwise Express
// would match "clear-all" as a notificationId param and never reach here.
router.delete(
  "/clear-all",
  auth,
  clearAllNotifications
);

router.delete(
  "/:notificationId",
  auth,
  deleteNotification
);

export default router;
