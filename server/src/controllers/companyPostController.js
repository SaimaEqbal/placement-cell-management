import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";

export const createPost = async (req, res) => {
  try {
    const { title, post_type, content } = req.body;

    const result = await pool.query(
      `INSERT INTO company_posts
      (
        title,
        post_type,
        content,
        posted_by
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [
        title,
        post_type,
        content,
        req.user.userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to create post");
    return res.status(status).json({ message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM company_posts
       ORDER BY created_at DESC`
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
      `SELECT *
       FROM company_posts
       WHERE post_id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to fetch post");
    return res.status(status).json({ message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const {
      title,
      post_type,
      content,
    } = req.body;

    const result = await pool.query(
      `UPDATE company_posts
       SET
          title = $1,
          post_type = $2,
          content = $3,
          updated_at = NOW()
       WHERE post_id = $4
       RETURNING *`,
      [
        title,
        post_type,
        content,
        postId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to update post");
    return res.status(status).json({ message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `DELETE FROM company_posts
       WHERE post_id = $1
       RETURNING *`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to delete post");
    return res.status(status).json({ message });
  }
};

export const getAttachmentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM company_post_attachments
       WHERE post_id = $1
       ORDER BY attachment_id`,
      [postId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to fetch attachments");
    return res.status(status).json({ message });
  }
};

export const uploadAttachments = async (req, res) => {
  try {
    const { postId } = req.params;

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No attachments provided",
      });
    }

    for (const file of files) {
      await pool.query(
        `INSERT INTO company_post_attachments
        (
          post_id,
          file_name,
          mime_type,
          file_url
        )
        VALUES ($1, $2, $3, $4)`,
        [
          postId,
          file.originalname ?? null,
          file.mimetype ?? null,
          file.publicUrl,
        ]
      );
    }

    return res.status(201).json({
      message: "Attachments uploaded successfully",
    });
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to upload attachments");
    return res.status(status).json({ message });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const result = await pool.query(
      `DELETE FROM company_post_attachments
       WHERE attachment_id = $1
       RETURNING *`,
      [attachmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Attachment not found",
      });
    }

    return res.status(200).json({
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error(error);

    const { status, message } = pgErrorResponse(error, "Failed to delete attachment");
    return res.status(status).json({ message });
  }
};