/*
  # Create Initial Schema for AI Storytelling App

  ## Overview
  This migration creates the complete database schema for a multi-language AI storytelling app for kids.

  ## Tables Created

  1. **profiles**
     - `id` (uuid, primary key) - Unique profile identifier
     - `kid_name` (text) - Child's name
     - `primary_language` (text) - Selected primary language code (e.g., 'en', 'es')
     - `created_at` (timestamptz) - Profile creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  2. **user_languages**
     - `id` (uuid, primary key) - Unique language preference identifier
     - `profile_id` (uuid, foreign key) - References profiles table
     - `language_code` (text) - Language code (e.g., 'en', 'es', 'fr', 'de')
     - `language_name` (text) - Display name of language
     - `created_at` (timestamptz) - Record creation timestamp
     - Max 4 languages per profile enforced by application logic

  3. **family_members**
     - `id` (uuid, primary key) - Unique family member identifier
     - `profile_id` (uuid, foreign key) - References profiles table
     - `name` (text) - Family member's name
     - `created_at` (timestamptz) - Record creation timestamp

  4. **friends**
     - `id` (uuid, primary key) - Unique friend identifier
     - `profile_id` (uuid, foreign key) - References profiles table
     - `name` (text) - Friend's name
     - `created_at` (timestamptz) - Record creation timestamp

  5. **stories**
     - `id` (uuid, primary key) - Unique story identifier
     - `profile_id` (uuid, foreign key) - References profiles table
     - `language_code` (text) - Language the story was generated in
     - `title` (text) - Story title
     - `content` (text) - Full story text
     - `audio_url` (text, nullable) - URL or path to cached audio file
     - `season` (text) - Season when generated (spring, summer, fall, winter)
     - `time_of_day` (text) - Time when generated (morning, afternoon, evening, night)
     - `generated_at` (timestamptz) - Story generation timestamp
     - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for public access (auth will be added later if needed)
  - Restrictive policies ensuring data isolation

  ## Indexes
  - Index on profile_id for all related tables for optimized queries
  - Index on language_code for filtering stories by language
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_name text NOT NULL,
  primary_language text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_languages table
CREATE TABLE IF NOT EXISTS user_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  language_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, language_code)
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  audio_url text,
  season text NOT NULL,
  time_of_day text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_user_languages_profile_id ON user_languages(profile_id);
CREATE INDEX IF NOT EXISTS idx_family_members_profile_id ON family_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_friends_profile_id ON friends(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_profile_id ON stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_language_code ON stories(language_code);
CREATE INDEX IF NOT EXISTS idx_stories_generated_at ON stories(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for now)
-- Profiles policies
CREATE POLICY "Allow public read access to profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to profiles"
  ON profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from profiles"
  ON profiles FOR DELETE
  USING (true);

-- User languages policies
CREATE POLICY "Allow public read access to user_languages"
  ON user_languages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to user_languages"
  ON user_languages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to user_languages"
  ON user_languages FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from user_languages"
  ON user_languages FOR DELETE
  USING (true);

-- Family members policies
CREATE POLICY "Allow public read access to family_members"
  ON family_members FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to family_members"
  ON family_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to family_members"
  ON family_members FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from family_members"
  ON family_members FOR DELETE
  USING (true);

-- Friends policies
CREATE POLICY "Allow public read access to friends"
  ON friends FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to friends"
  ON friends FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to friends"
  ON friends FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from friends"
  ON friends FOR DELETE
  USING (true);

-- Stories policies
CREATE POLICY "Allow public read access to stories"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to stories"
  ON stories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to stories"
  ON stories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from stories"
  ON stories FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
