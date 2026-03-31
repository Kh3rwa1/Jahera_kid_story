/*
  # Fix INSERT RLS policies to add WITH CHECK constraints

  All INSERT policies currently lack WITH CHECK clauses, meaning anyone authenticated
  can insert into any profile_id. This migration drops and recreates INSERT policies
  to properly enforce ownership.
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own languages" ON user_languages;
CREATE POLICY "Users can insert own languages"
  ON user_languages FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own family members" ON family_members;
CREATE POLICY "Users can insert own family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own friends" ON friends;
CREATE POLICY "Users can insert own friends"
  ON friends FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own quiz questions" ON quiz_questions;
CREATE POLICY "Users can insert own quiz questions"
  ON quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    story_id IN (
      SELECT s.id FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own quiz answers" ON quiz_answers;
CREATE POLICY "Users can insert own quiz answers"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    question_id IN (
      SELECT qq.id FROM quiz_questions qq
      JOIN stories s ON s.id = qq.story_id
      JOIN profiles p ON p.id = s.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own streak" ON streaks;
CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own interests" ON profile_interests;
CREATE POLICY "Users can insert own interests"
  ON profile_interests FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
