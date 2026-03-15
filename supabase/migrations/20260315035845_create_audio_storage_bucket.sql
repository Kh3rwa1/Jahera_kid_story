/*
  # Create audio storage bucket

  1. Storage
    - Creates a public `story-audio` bucket for storing MP3 audio files
    - Files are publicly readable so the audio player can stream them
    - Only authenticated users can upload/delete their own files

  2. Security
    - Public read access for all audio files (needed for audio playback)
    - Authenticated users can only insert/delete files under their own user ID prefix
*/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-audio',
  'story-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

create policy "Public read access for story audio"
  on storage.objects for select
  using (bucket_id = 'story-audio');

create policy "Authenticated users can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'story-audio');

create policy "Authenticated users can delete own audio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'story-audio');
