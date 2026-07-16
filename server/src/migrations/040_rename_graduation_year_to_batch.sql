-- The app's vocabulary is "Batch of" (client/src/lib/validation.ts BATCH_OPTIONS):
-- students pick a batch like "2023-27" and the stored value is the passing-out
-- year INT (2027). The column name still said graduation_year - rename it so the
-- DB matches the vocabulary: students.graduation_year -> students.batch.
--
-- Safe with the is_profile_complete STORED GENERATED column: Postgres tracks the
-- expression by attribute number, so the rename carries through automatically.
-- Historical migrations (001, 012-034) keep the old name, as applied history.

ALTER TABLE students RENAME COLUMN graduation_year TO batch;
