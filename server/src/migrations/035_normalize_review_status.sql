-- Normalize seed-imported review_status values to the app's workflow vocabulary.
--
-- The bulk import (034.sql) stored review_status = 'approved', a value the SPC/TPC
-- verification pipeline never reads or writes (the app uses
-- pending -> spc_verified/spc_rejected -> verified/rejected). As a result every
-- imported student, and every SPC coordinator promoted from one, was invisible in
-- the TPC verification queues.
--
-- Decision:
--   * SPC coordinators' OWN student records -> 'pending'. SPCs skip SPC review and
--     are verified directly by the TPC; the TPC "Awaiting TPC verification" queue
--     surfaces SPC coordinators whose record is 'pending'.
--   * All other 'approved' students -> 'spc_verified' (SPC-approved, now awaiting
--     the TPC's final verification).
--
-- Order matters: flip the SPCs first so the second (broad) update no longer sees
-- them as 'approved'.

BEGIN;

UPDATE students
   SET review_status = 'pending'
 WHERE review_status = 'approved'
   AND user_id IN (SELECT user_id FROM spc);

UPDATE students
   SET review_status = 'spc_verified'
 WHERE review_status = 'approved';

COMMIT;
