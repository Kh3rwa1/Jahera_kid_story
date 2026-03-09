/*
  # Delete orphaned stories without quiz data

  1. Changes
    - Deletes all stories that have no associated quiz questions
    - These are seed/test data that were inserted directly into the database
      without going through the normal generation flow, so they never received
      quiz content

  2. Important Notes
    - Only affects stories with zero quiz_questions rows
    - Uses a subquery to safely identify orphaned stories
*/

DELETE FROM stories
WHERE id NOT IN (
  SELECT DISTINCT story_id FROM quiz_questions
);