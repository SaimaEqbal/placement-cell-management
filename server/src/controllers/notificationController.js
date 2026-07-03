import pool from "../config/db.js";

/**
 * Purpose: internal helper for other controllers to raise a notification for
 * a user (e.g. driveController on createDrive, applicationController on
 * status changes). Not exposed as a route - called directly from JS.
 * Kept here rather than in a separate service file so every notifications
 * query lives in one place, matching how the rest of this codebase groups
 * table access by controller.
 */
export const createNotification = async (
  userId,
  title,
  message,
  tone = "blue"
) => {
  const result = await pool.query(
    `INSERT INTO notifications (
        user_id,
        title,
        message,
        tone
     )
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, message, tone]
  );

  return result.rows[0];
};

/**
 * Purpose: internal helper for broadcasting one notification to every user
 * of a given role in a single query (e.g. announcing a new drive to every
 * student), instead of looping createNotification() per user. Not exposed
 * as a route - called directly from other controllers.
 */
export const createNotificationForRole = async (
  role,
  title,
  message,
  tone = "blue"
) => {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, tone)
     SELECT id, $1, $2, $3
     FROM users
     WHERE role = $4`,
    [title, message, tone, role]
  );
};

/** Purpose: GET /notifications - list the signed-in user's own notifications, newest first. */
export const getMyNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

/** Purpose: PATCH /notifications/:notificationId/read - mark one of the signed-in user's notifications as read. */
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1
       AND user_id = $2
       RETURNING *`,
      [notificationId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};

/** Purpose: PATCH /notifications/read-all - mark every notification belonging to the signed-in user as read. */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1
       AND read = FALSE
       RETURNING *`,
      [req.user.userId]
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({
      message: "Failed to mark notifications as read",
    });
  }
};

/** Purpose: DELETE /notifications/:notificationId - remove one of the signed-in user's notifications. */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1
       AND user_id = $2
       RETURNING id`,
      [notificationId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch {
    return res.status(500).json({
      message: "Failed to delete notification",
    });
  }
};
