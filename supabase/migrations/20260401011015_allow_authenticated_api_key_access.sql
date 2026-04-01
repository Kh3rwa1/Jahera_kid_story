/*
  # Allow authenticated users to read and write API keys

  The previous policy blocked ALL access for authenticated users.
  API keys are stored per-deployment (shared), so authenticated users
  need read/write access to manage keys through the app settings.

  The edge functions use service_role so they already bypass RLS.
*/

DROP POLICY IF EXISTS "No direct access to API keys" ON api_keys;

CREATE POLICY "Authenticated users can read api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
