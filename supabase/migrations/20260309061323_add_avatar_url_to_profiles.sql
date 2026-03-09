/*
  # Add avatar_url column to profiles

  1. Modified Tables
    - `profiles`
      - Added `avatar_url` (text, nullable) - stores the URL of the user's profile photo

  2. Notes
    - This column was referenced in the application code but was missing from the schema
    - Nullable because not all users will have a profile photo
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;
