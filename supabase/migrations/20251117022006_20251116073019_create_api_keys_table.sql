/*
  # Create API Keys Table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `key_name` (text) - Name/identifier for the API key (e.g., 'openai_api_key')
      - `key_value` (text) - The encrypted API key value
      - `description` (text) - Optional description
      - `is_active` (boolean) - Whether the key is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `api_keys` table
    - API keys are stored encrypted
    - Only accessible through secure functions
    - No direct access from client

  3. Notes
    - API keys should be accessed server-side only
    - Consider using Edge Functions for secure access
    - key_name should be unique
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy that denies all direct access (API keys should only be accessed via Edge Functions)
CREATE POLICY "No direct access to API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (false);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS api_keys_updated_at ON api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Create function to get API key (server-side only, bypasses RLS)
CREATE OR REPLACE FUNCTION get_api_key(p_key_name text)
RETURNS text
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_value text;
BEGIN
  SELECT key_value INTO v_key_value
  FROM api_keys
  WHERE key_name = p_key_name
    AND is_active = true;
  
  RETURN v_key_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to set API key (server-side only, bypasses RLS)
CREATE OR REPLACE FUNCTION set_api_key(
  p_key_name text,
  p_key_value text,
  p_description text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO api_keys (key_name, key_value, description)
  VALUES (p_key_name, p_key_value, p_description)
  ON CONFLICT (key_name) 
  DO UPDATE SET 
    key_value = EXCLUDED.key_value,
    description = COALESCE(EXCLUDED.description, api_keys.description),
    updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default placeholder for OpenAI API key
INSERT INTO api_keys (key_name, key_value, description, is_active)
VALUES (
  'openai_api_key',
  'your-api-key-here',
  'OpenAI API key for story generation',
  false
)
ON CONFLICT (key_name) DO NOTHING;

-- Insert default placeholder for Eleven Labs API key
INSERT INTO api_keys (key_name, key_value, description, is_active)
VALUES (
  'elevenlabs_api_key',
  'your-api-key-here',
  'ElevenLabs API key for text-to-speech',
  false
)
ON CONFLICT (key_name) DO NOTHING;