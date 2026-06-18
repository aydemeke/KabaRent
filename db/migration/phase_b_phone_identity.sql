-- =============================================================================
-- Phase B — Email -> Phone identity migration (DATA backfill + DDL)
-- Project: KabaRent   |   Table: customers
-- -----------------------------------------------------------------------------
-- HOW TO RUN:
--   * Run this MANUALLY via the Neon SQL console (or psql) — NOT through the app.
--   * The application stays on the CURRENTLY DEPLOYED (email-identity) version
--     until this migration has completed successfully. Do NOT deploy the
--     phone-identity build (feat/phone-auth-migration) until after COMMIT.
--
-- BEFORE YOU RUN:
--   * Step 1 has a PLACEHOLDER for customer id=1 (name "אגינהו"), whose stored
--     phone "05425465428" is INVALID (11 digits). A human MUST supply the real,
--     verified number in E.164 form (or otherwise resolve that row). DO NOT GUESS.
--     The transaction will leave id=1 with a bad value if the placeholder is not
--     replaced — and the UNIQUE/format expectations of the app will not be met.
--
-- HOW TO REVIEW:
--   * This is ONE transaction. Run it top-to-bottom. Step 3 prints the full table.
--   * Inspect that SELECT output. COMMIT only if every row looks correct;
--     otherwise type ROLLBACK; instead of COMMIT; to abort with zero changes.
--
-- DERIVATION OF VALUES:
--   * The E.164 literals in step 2 were computed by the SAME normalization the
--     app uses (PhoneNumberService.normalizeToE164, libphonenumber, region IL),
--     verified by the read-only dry-run runner against this database.
--   * Dry-run findings: 4 rows total (1 ADMIN skipped), 2 will change,
--     0 already-canonical, 1 invalid (id=1), 0 collision groups.
-- =============================================================================

BEGIN;

-- 1. Invalid row. id=1 ("אגינהו") raw "05425465428" is invalid (11 digits).
--    The correct number is UNKNOWN — a human MUST supply it. DO NOT GUESS.
UPDATE customers SET phone = '<FILL_VERIFIED_E164 — human supplies real number>' WHERE id = 1;

-- 2. Backfill the changing rows to canonical E.164 (literal values from the dry-run),
--    one UPDATE per row, each commented with the old raw value:
UPDATE customers SET phone = '+972542657485' WHERE id = 3;  -- was "0542657485"
UPDATE customers SET phone = '+972545380627' WHERE id = 4;  -- was "0545380627"

-- 3. Verification (review this output before committing):
SELECT id, full_name, phone, email, role FROM customers ORDER BY id;

-- 4. DDL — only after the data above is correct:
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE customers ADD CONSTRAINT uq_customers_phone UNIQUE (phone);

COMMIT;
-- (Abort instead with: ROLLBACK;)
