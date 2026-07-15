// Shared announcement (company_posts) persistence helpers, reused by the
// announcement CRUD controller and the atomic drive-creation flow so a drive-
// linked announcement is created exactly like a standalone one. Attachments are
// pasted Google Drive links (file_name = name, file_url = URL), never uploads.

/**
 * A post's attachments as an ordered JSON array, to embed into a `company_posts`
 * row aliased `p`. Deterministically ordered by display_order.
 */
export const ATTACHMENTS_SUBQUERY = `
  COALESCE(
    (
      SELECT json_agg(a ORDER BY a.display_order, a.attachment_id)
      FROM company_post_attachments a
      WHERE a.post_id = p.post_id
    ),
    '[]'
  ) AS attachments`;

/**
 * Insert one announcement row on the caller's transaction client. A null
 * driveId produces a standalone announcement; a real driveId links it to that
 * drive (the DB's UNIQUE(drive_id) enforces one announcement per drive).
 */
export async function insertAnnouncement(client, { title, content, postedBy, driveId = null }) {
  const result = await client.query(
    `INSERT INTO company_posts (title, post_type, content, posted_by, drive_id)
     VALUES ($1, 'announcement', $2, $3, $4)
     RETURNING *`,
    [title, content, postedBy, driveId]
  );
  return result.rows[0];
}

/**
 * Replace a post's attachments with exactly `attachments` (in order), on the
 * caller's transaction client. Returns the freshly-saved rows.
 */
export async function replaceAttachments(client, postId, attachments = []) {
  await client.query(
    `DELETE FROM company_post_attachments WHERE post_id = $1`,
    [postId]
  );

  const saved = [];
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const inserted = await client.query(
      `INSERT INTO company_post_attachments
         (post_id, file_name, file_url, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, a.file_name, a.file_url, i]
    );
    saved.push(inserted.rows[0]);
  }
  return saved;
}
