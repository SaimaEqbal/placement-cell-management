-- Placement 2x ("second chance") rule + internship selection state.
--
-- placed_package: the CTC (LPA) of the drive the student was placed via. Used to
-- enforce the second-chance rule: a placed student may only sit in a placement
-- drive whose package is >= 2x this value. Updated again if they win a second
-- chance. NULL for never-placed students (and legacy placed rows, which are then
-- simply ineligible for second chances until backfilled).
--
-- selected_for_internship: independent boolean flag (NOT a placement_status
-- value) because a student can be selected for an internship AND later placed -
-- the two facts must not overwrite each other. Internship drives have no
-- placement criteria and never touch placement_status.
--
-- placement_status additionally gains the value 'second_chance' (no CHECK
-- constraint exists on this column; the vocabulary lives in lib/schema.js):
--   unplaced -> placed (first placement, records placed_package)
--   placed   -> second_chance (won a >=2x drive; terminal - no further drives)

ALTER TABLE students
    ADD COLUMN placed_package NUMERIC(10,2);

ALTER TABLE students
    ADD COLUMN selected_for_internship BOOLEAN NOT NULL DEFAULT FALSE;
