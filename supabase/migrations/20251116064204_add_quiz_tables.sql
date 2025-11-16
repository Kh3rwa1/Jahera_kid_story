/*
  # Add Quiz Tables for Story Quizzes

  ## Overview
  This migration adds tables to support interactive quizzes after each story, including questions, answer options, and user quiz attempts.

  ## Tables Created

  1. **quiz_questions**
     - `id` (uuid, primary key) - Unique question identifier
     - `story_id` (uuid, foreign key) - References stories table
     - `question_text` (text) - The quiz question
     - `question_order` (integer) - Order of the question (1, 2, 3)
     - `created_at` (timestamptz) - Record creation timestamp

  2. **quiz_answers**
     - `id` (uuid, primary key) - Unique answer identifier
     - `question_id` (uuid, foreign key) - References quiz_questions table
     - `answer_text` (text) - The answer option text
     - `is_correct` (boolean) - Whether this is the correct answer
     - `answer_order` (text) - Order letter (A, B, C)
     - `created_at` (timestamptz) - Record creation timestamp

  3. **quiz_attempts**
     - `id` (uuid, primary key) - Unique attempt identifier
     - `profile_id` (uuid, foreign key) - References profiles table
     - `story_id` (uuid, foreign key) - References stories table
     - `score` (integer) - Score achieved (0-3)
     - `total_questions` (integer) - Total number of questions
     - `completed_at` (timestamptz) - When quiz was completed
     - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for public access

  ## Indexes
  - Index on story_id for quiz_questions
  - Index on question_id for quiz_answers
  - Index on profile_id and story_id for quiz_attempts
*/

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  answer_order text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 3,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_story_id ON quiz_questions(story_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_profile_id ON quiz_attempts(profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_story_id ON quiz_attempts(story_id);

-- Enable Row Level Security
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz questions policies
CREATE POLICY "Allow public read access to quiz_questions"
  ON quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to quiz_questions"
  ON quiz_questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to quiz_questions"
  ON quiz_questions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from quiz_questions"
  ON quiz_questions FOR DELETE
  USING (true);

-- Quiz answers policies
CREATE POLICY "Allow public read access to quiz_answers"
  ON quiz_answers FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to quiz_answers"
  ON quiz_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to quiz_answers"
  ON quiz_answers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from quiz_answers"
  ON quiz_answers FOR DELETE
  USING (true);

-- Quiz attempts policies
CREATE POLICY "Allow public read access to quiz_attempts"
  ON quiz_attempts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to quiz_attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to quiz_attempts"
  ON quiz_attempts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from quiz_attempts"
  ON quiz_attempts FOR DELETE
  USING (true);
