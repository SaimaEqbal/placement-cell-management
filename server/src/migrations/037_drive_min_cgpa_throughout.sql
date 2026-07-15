-- Optional per-drive eligibility constraint: a minimum SPI that must hold for
-- EVERY recorded semester (not just the aggregate CGPA). When set, a candidate
-- is eligible only if each of their non-null semester SPIs is >= this value.
-- NULL = no throughout constraint (the default; existing drives are unaffected).

ALTER TABLE drives
    ADD COLUMN minimum_cgpa_throughout NUMERIC(3,2);
