/*
  # Add location fields to stories table

  ## Summary
  Adds two optional columns to the `stories` (profiles_stories) table to store
  the geographic context used when generating a story.

  ## Changes
  - `location_city` (text, nullable) — city or district name detected at generation time
  - `location_country` (text, nullable) — country name detected at generation time

  ## Notes
  - Both columns are nullable so existing stories are unaffected
  - No RLS changes needed — existing policies on the stories table already cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'location_city'
  ) THEN
    ALTER TABLE stories ADD COLUMN location_city text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'location_country'
  ) THEN
    ALTER TABLE stories ADD COLUMN location_country text DEFAULT NULL;
  END IF;
END $$;
