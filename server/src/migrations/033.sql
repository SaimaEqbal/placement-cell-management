-- Phase 2: an announcement may optionally belong to exactly one drive.
--
-- The relationship is explicit (never inferred): company_posts.drive_id points
-- at the drive the announcement belongs to, or NULL for a standalone
-- announcement. A UNIQUE constraint enforces at most one announcement per drive
-- (Postgres allows many NULLs, so any number of standalone announcements remain
-- valid). ON DELETE CASCADE means deleting a drive also deletes its linked
-- announcement (the agreed behaviour); deleting the announcement never touches
-- the drive, since the announcement is the child row.

ALTER TABLE company_posts
    ADD COLUMN drive_id INT
        REFERENCES drives(drive_id)
        ON DELETE CASCADE;

ALTER TABLE company_posts
    ADD CONSTRAINT company_posts_drive_id_unique UNIQUE (drive_id);
