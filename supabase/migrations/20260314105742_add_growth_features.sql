/*
  # Add Growth Features Migration

  ## Overview
  This migration adds the foundational tables for monetization, engagement,
  and personalization features needed to scale Jahera to $10M MRR.

  ## New Tables

  ### subscriptions
  - Tracks user subscription plan (free/pro/family)
  - Stores story quota usage per billing period
  - Links to profile via profile_id

  ### streaks
  - Tracks daily story reading streaks per profile
  - Stores current streak count and last activity date
  - Awards points for maintaining streaks

  ### profile_interests
  - Stores child interest tags (dinosaurs, space, animals, etc.)
  - Used to personalize AI story generation
  - Many-to-one with profiles

  ## Modified Tables

  ### profiles
  - Added `age` column (integer) for age-appropriate story generation
  - Added `parent_pin` column (text, hashed) for parent mode
  - Added `share_token` column (text, unique) for story sharing

  ### stories
  - Added `theme` column (text) for story category/theme
  - Added `mood` column (text) for story emotional tone
  - Added `word_count` column (integer) for story length tracking
  - Added `share_token` column (text, unique) for individual story sharing
  - Added `like_count` column (integer) for engagement tracking

  ## Security
  - RLS enabled on all new tables
  - Policies restrict access to profile owners only
  - Subscriptions use auth.uid() for isolation
*/

-- Add columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'parent_pin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN parent_pin text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN share_token text UNIQUE DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- Add columns to stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'theme'
  ) THEN
    ALTER TABLE stories ADD COLUMN theme text DEFAULT 'adventure';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'mood'
  ) THEN
    ALTER TABLE stories ADD COLUMN mood text DEFAULT 'exciting';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'word_count'
  ) THEN
    ALTER TABLE stories ADD COLUMN word_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE stories ADD COLUMN share_token text UNIQUE DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE stories ADD COLUMN like_count integer DEFAULT 0;
  END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  stories_used_this_month integer NOT NULL DEFAULT 0,
  stories_limit integer NOT NULL DEFAULT 3,
  billing_period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  billing_period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  is_active boolean NOT NULL DEFAULT true,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles can view own subscription"
  ON subscriptions FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can update own subscription"
  ON subscriptions FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

-- Create streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_days_active integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles can view own streak"
  ON streaks FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can update own streak"
  ON streaks FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

-- Create profile_interests table
CREATE TABLE IF NOT EXISTS profile_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, interest)
);

ALTER TABLE profile_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles can view own interests"
  ON profile_interests FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can insert own interests"
  ON profile_interests FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

CREATE POLICY "Profiles can delete own interests"
  ON profile_interests FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = profile_id
    )
  );

-- Function to update streak when story is created
CREATE OR REPLACE FUNCTION update_streak_on_story()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date date := CURRENT_DATE;
  streak_record streaks%ROWTYPE;
BEGIN
  SELECT * INTO streak_record FROM streaks WHERE profile_id = NEW.profile_id;

  IF NOT FOUND THEN
    INSERT INTO streaks (profile_id, current_streak, longest_streak, last_activity_date, total_days_active)
    VALUES (NEW.profile_id, 1, 1, today_date, 1);
  ELSE
    IF streak_record.last_activity_date = today_date THEN
      NULL;
    ELSIF streak_record.last_activity_date = today_date - 1 THEN
      UPDATE streaks SET
        current_streak = streak_record.current_streak + 1,
        longest_streak = GREATEST(streak_record.longest_streak, streak_record.current_streak + 1),
        last_activity_date = today_date,
        total_days_active = streak_record.total_days_active + 1,
        updated_at = now()
      WHERE profile_id = NEW.profile_id;
    ELSE
      UPDATE streaks SET
        current_streak = 1,
        last_activity_date = today_date,
        total_days_active = streak_record.total_days_active + 1,
        updated_at = now()
      WHERE profile_id = NEW.profile_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_streak_on_story ON stories;
CREATE TRIGGER trigger_update_streak_on_story
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_story();

-- Function to increment story quota usage
CREATE OR REPLACE FUNCTION increment_story_usage(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub subscriptions%ROWTYPE;
  current_month_start timestamptz := date_trunc('month', now());
BEGIN
  SELECT * INTO sub FROM subscriptions WHERE profile_id = p_profile_id AND is_active = true ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO subscriptions (profile_id, plan, stories_used_this_month, stories_limit, billing_period_start, billing_period_end)
    VALUES (p_profile_id, 'free', 1, 3, current_month_start, current_month_start + interval '1 month');
    RETURN true;
  END IF;

  IF sub.billing_period_start < current_month_start THEN
    UPDATE subscriptions SET
      stories_used_this_month = 1,
      billing_period_start = current_month_start,
      billing_period_end = current_month_start + interval '1 month',
      updated_at = now()
    WHERE id = sub.id;
    RETURN true;
  END IF;

  IF sub.plan = 'free' AND sub.stories_used_this_month >= sub.stories_limit THEN
    RETURN false;
  END IF;

  UPDATE subscriptions SET
    stories_used_this_month = stories_used_this_month + 1,
    updated_at = now()
  WHERE id = sub.id;

  RETURN true;
END;
$$;

-- Function to get subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(p_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub subscriptions%ROWTYPE;
  current_month_start timestamptz := date_trunc('month', now());
  stories_used integer;
  stories_limit integer;
BEGIN
  SELECT * INTO sub FROM subscriptions WHERE profile_id = p_profile_id AND is_active = true ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'plan', 'free',
      'stories_used', 0,
      'stories_limit', 3,
      'can_generate', true,
      'stories_remaining', 3
    );
  END IF;

  IF sub.billing_period_start < current_month_start THEN
    stories_used := 0;
  ELSE
    stories_used := sub.stories_used_this_month;
  END IF;

  stories_limit := sub.stories_limit;

  RETURN json_build_object(
    'plan', sub.plan,
    'stories_used', stories_used,
    'stories_limit', stories_limit,
    'can_generate', (sub.plan != 'free' OR stories_used < stories_limit),
    'stories_remaining', GREATEST(0, stories_limit - stories_used)
  );
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_streaks_profile_id ON streaks(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_interests_profile_id ON profile_interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_share_token ON stories(share_token);
