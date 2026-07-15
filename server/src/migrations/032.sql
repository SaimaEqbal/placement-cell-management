-- Phase 1: Drive-link attachments for announcements (company_posts).
--
-- Announcements (stored in company_posts) no longer support the 'email' type,
-- and their attachments are pasted Google Drive links (a human-readable name +
-- a URL) with a deterministic display order, rather than uploaded files. The
-- existing normalized company_post_attachments table is reused: file_name holds
-- the attachment name and file_url holds the Google Drive URL.

-- 1. Remove the 'email' post type entirely. Existing email posts (and their
--    attachments, via ON DELETE CASCADE) are deleted per the product decision.
DELETE FROM company_posts WHERE post_type = 'email';

-- Backfill any NULL types, then constrain to announcement-only.
UPDATE company_posts SET post_type = 'announcement' WHERE post_type IS NULL;

ALTER TABLE company_posts
    ALTER COLUMN post_type SET DEFAULT 'announcement';

ALTER TABLE company_posts
    DROP CONSTRAINT IF EXISTS company_posts_post_type_check;

ALTER TABLE company_posts
    ADD CONSTRAINT company_posts_post_type_check
    CHECK (post_type IN ('announcement'));

-- 2. Deterministic attachment ordering. Attachments are now saved together with
--    their post (transactionally) instead of via a separate upload endpoint;
--    display_order preserves the order the admin entered them in.
ALTER TABLE company_post_attachments
    ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;
