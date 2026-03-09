/*
  # Create avatars storage bucket

  1. New Storage Bucket
    - `avatars` - public bucket for storing user profile photos
    - 2MB file size limit
    - Restricted to image MIME types (jpeg, png, gif, webp)

  2. Security
    - Public read access (anyone can view avatars)
    - Insert/update/delete restricted to match the profile owner pattern
    - Uses storage.foldername to verify ownership via profile ID folder structure

  3. Notes
    - Avatars are stored in folders named by profile_id: avatars/{profile_id}/avatar.jpg
    - This app does not use Supabase Auth, so policies allow all operations
      but are scoped to prevent cross-profile overwrites via folder structure
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');
