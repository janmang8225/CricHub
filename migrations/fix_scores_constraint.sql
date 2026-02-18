-- Migration: Fix scores table constraint
-- Issue: Constraint was on (match_id, team_id) but should be (match_id, team_id, innings)
-- This allows teams to have multiple innings entries (one per innings they bat)

BEGIN;

-- 1. Drop the old constraint
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_match_id_team_id_key;

-- 2. Clean up any incorrect data (keep only 2 rows per match: one per innings)
-- Delete duplicate rows where both teams have entries for the same innings
DELETE FROM scores
WHERE id IN (
  SELECT s1.id
  FROM scores s1
  INNER JOIN scores s2
    ON s1.match_id = s2.match_id
    AND s1.innings = s2.innings
    AND s1.team_id != s2.team_id
    AND s1.id > s2.id
);

-- 3. Add new composite unique constraint
ALTER TABLE scores ADD CONSTRAINT scores_match_id_team_id_innings_key
  UNIQUE(match_id, team_id, innings);

-- 4. Add check constraint to ensure innings is valid
ALTER TABLE scores ADD CONSTRAINT scores_innings_valid
  CHECK (innings > 0 AND innings <= 4);

COMMIT;
