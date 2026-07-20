import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";
import {
  ATTACHMENTS_SUBQUERY,
  insertAnnouncement,
  replaceAttachments,
} from "../lib/announcements.js";
import { createNotificationForRole } from "./notificationController.js";

// A drive can have at most one announcement (company_posts_drive_id_unique).
// Surface that as a clear 409 rather than a generic duplicate-key error.
function driveConflict(error) {
  return (
    error.code === "23505" &&
    error.constraint === "company_posts_drive_id_unique"
  );
}

export const createPost = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, content, attachments = [], drive_id = null } = req.body;

    await client.query("BEGIN");

    const post = await insertAnnouncement(client, {
      title,
      content,
      postedBy: req.user.userId,
      driveId: drive_id,
    });
    const savedAttachments = await replaceAttachments(client, post.post_id, attachments);

    await client.query("COMMIT");

    // Broadcast to every student - announcements are a general update, not
    // scoped to a particular drive's eligible students.
    await createNotificationForRole(
      "student",
      "New announcement",
      post.title,
      "blue"
    );

    return res.status(201).json({ ...post, attachments: savedAttachments });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    if (driveConflict(error)) {
      return res.status(409).json({ message: "This drive already has an announcement." });
    }
    const { status, message } = pgErrorResponse(error, "Failed to create post");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

export const getPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, ${ATTACHMENTS_SUBQUERY}
       FROM company_posts p
       ORDER BY p.created_at DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch posts");
    return res.status(status).json({ message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT p.*, ${ATTACHMENTS_SUBQUERY}
       FROM company_posts p
       WHERE p.post_id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch post");
    return res.status(status).json({ message });
  }
};

export const updatePost = async (req, res) => {
  const client = await pool.connect();
  try {
    const { postId } = req.params;
    const { title, content, attachments } = req.body;

    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT * FROM company_posts WHERE post_id = $1 FOR UPDATE`,
      [postId]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Post not found" });
    }

    const current = existing.rows[0];
    const newTitle = title !== undefined ? title : current.title;
    const newContent = content !== undefined ? content : current.content;

    // drive_id is intentionally NOT editable here: the link is owned by the
    // drive-creation / drive-management flows, not by editing announcement body.
    const updated = await client.query(
      `UPDATE company_posts
         SET title = $1,
             content = $2,
             updated_at = NOW()
       WHERE post_id = $3
       RETURNING *`,
      [newTitle, newContent, postId]
    );

    // Only touch attachments when the client sent them (the edit form always
    // does, even as []). Omitting the key preserves the existing attachments.
    let savedAttachments;
    if (attachments !== undefined) {
      savedAttachments = await replaceAttachments(client, postId, attachments);
    } else {
      const rows = await client.query(
        `SELECT * FROM company_post_attachments
          WHERE post_id = $1
          ORDER BY display_order, attachment_id`,
        [postId]
      );
      savedAttachments = rows.rows;
    }

    await client.query("COMMIT");

    return res.status(200).json({ ...updated.rows[0], attachments: savedAttachments });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to update post");
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Attachments are removed automatically by the ON DELETE CASCADE FK. A
    // drive-linked announcement is the CHILD of the drive, so deleting it here
    // never deletes the drive.
    const result = await pool.query(
      `DELETE FROM company_posts
       WHERE post_id = $1
       RETURNING *`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to delete post");
    return res.status(status).json({ message });
  }
};
