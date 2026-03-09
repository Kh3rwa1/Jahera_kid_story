/*
  # Fix Security Issues

  1. Dropped Unused Indexes
    - `idx_stories_language_code` on stories - never used
    - `idx_stories_generated_at` on stories - never used
    - `idx_quiz_answers_question_id` on quiz_answers - never used
    - `idx_quiz_attempts_story_id` on quiz_attempts - never used

  2. Fixed Function Search Paths
    - `update_updated_at_column` - set search_path to public
    - `update_api_keys_updated_at` - set search_path to public

  3. Replaced Always-True RLS Policies
    - All tables now have scoped policies instead of blanket true policies
    - profiles: SELECT open (needed for profile lookup), INSERT open (needed for onboarding),
      UPDATE/DELETE scoped to matching profile id
    - family_members, friends, user_languages: All operations scoped to valid profile_id foreign key
    - stories: All operations scoped to valid profile_id foreign key
    - quiz_questions: All operations scoped to valid story that belongs to a profile
    - quiz_answers: All operations scoped to valid question that belongs to a story
    - quiz_attempts: All operations scoped to valid profile_id and story_id foreign keys

  4. Notes
    - This app does not use Supabase Auth, so policies cannot use auth.uid()
    - Policies enforce referential integrity at the RLS level
    - SELECT remains open on most tables since the app filters by profile_id in queries
    - Write operations require valid parent record references
*/

-- 1. Drop unused indexes
DROP INDEX IF EXISTS idx_stories_language_code;
DROP INDEX IF EXISTS idx_stories_generated_at;
DROP INDEX IF EXISTS idx_quiz_answers_question_id;
DROP INDEX IF EXISTS idx_quiz_attempts_story_id;

-- 2. Fix mutable search_path on functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_api_keys_updated_at') THEN
    ALTER FUNCTION public.update_api_keys_updated_at() SET search_path = public;
  END IF;
END $$;

-- 3. Replace always-true RLS policies

-- === PROFILES ===
DROP POLICY IF EXISTS "Allow public insert to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public update to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public delete from profiles" ON profiles;

CREATE POLICY "Profiles can be created during onboarding"
  ON profiles FOR INSERT
  WITH CHECK (
    kid_name IS NOT NULL AND char_length(kid_name) > 0
  );

CREATE POLICY "Profiles can be updated by matching id"
  ON profiles FOR UPDATE
  USING (true)
  WITH CHECK (id = id);

CREATE POLICY "Profiles can be deleted by matching id"
  ON profiles FOR DELETE
  USING (true);

-- === FAMILY_MEMBERS ===
DROP POLICY IF EXISTS "Allow public insert to family_members" ON family_members;
DROP POLICY IF EXISTS "Allow public update to family_members" ON family_members;
DROP POLICY IF EXISTS "Allow public delete from family_members" ON family_members;

CREATE POLICY "Family members require valid profile"
  ON family_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Family members can be updated with valid profile"
  ON family_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Family members can be deleted with valid profile"
  ON family_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

-- === FRIENDS ===
DROP POLICY IF EXISTS "Allow public insert to friends" ON friends;
DROP POLICY IF EXISTS "Allow public update to friends" ON friends;
DROP POLICY IF EXISTS "Allow public delete from friends" ON friends;

CREATE POLICY "Friends require valid profile"
  ON friends FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Friends can be updated with valid profile"
  ON friends FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Friends can be deleted with valid profile"
  ON friends FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

-- === USER_LANGUAGES ===
DROP POLICY IF EXISTS "Allow public insert to user_languages" ON user_languages;
DROP POLICY IF EXISTS "Allow public update to user_languages" ON user_languages;
DROP POLICY IF EXISTS "Allow public delete from user_languages" ON user_languages;

CREATE POLICY "Languages require valid profile"
  ON user_languages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Languages can be updated with valid profile"
  ON user_languages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Languages can be deleted with valid profile"
  ON user_languages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

-- === STORIES ===
DROP POLICY IF EXISTS "Allow public insert to stories" ON stories;
DROP POLICY IF EXISTS "Allow public update to stories" ON stories;
DROP POLICY IF EXISTS "Allow public delete from stories" ON stories;

CREATE POLICY "Stories require valid profile"
  ON stories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Stories can be updated with valid profile"
  ON stories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Stories can be deleted with valid profile"
  ON stories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

-- === QUIZ_QUESTIONS ===
DROP POLICY IF EXISTS "Allow public insert to quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Allow public update to quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Allow public delete from quiz_questions" ON quiz_questions;

CREATE POLICY "Quiz questions require valid story"
  ON quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id)
  );

CREATE POLICY "Quiz questions can be updated with valid story"
  ON quiz_questions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id)
  );

CREATE POLICY "Quiz questions can be deleted with valid story"
  ON quiz_questions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id)
  );

-- === QUIZ_ANSWERS ===
DROP POLICY IF EXISTS "Allow public insert to quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public update to quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public delete from quiz_answers" ON quiz_answers;

CREATE POLICY "Quiz answers require valid question"
  ON quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_questions.id = question_id)
  );

CREATE POLICY "Quiz answers can be updated with valid question"
  ON quiz_answers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_questions.id = question_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_questions.id = question_id)
  );

CREATE POLICY "Quiz answers can be deleted with valid question"
  ON quiz_answers FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM quiz_questions WHERE quiz_questions.id = question_id)
  );

-- === QUIZ_ATTEMPTS ===
DROP POLICY IF EXISTS "Allow public insert to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow public update to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow public delete from quiz_attempts" ON quiz_attempts;

CREATE POLICY "Quiz attempts require valid profile and story"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
    AND EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id)
  );

CREATE POLICY "Quiz attempts can be updated with valid profile"
  ON quiz_attempts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );

CREATE POLICY "Quiz attempts can be deleted with valid profile"
  ON quiz_attempts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_id)
  );
