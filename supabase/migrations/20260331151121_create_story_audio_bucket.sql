/*
  # Create story-audio storage bucket

  Creates a public storage bucket for storing generated audio files.
  Audio files are public so they can be streamed directly in the app.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-audio',
  'story-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can read story audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'story-audio');

CREATE POLICY "Authenticated users can upload story audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'story-audio');

CREATE POLICY "Service role can manage story audio"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'story-audio');
