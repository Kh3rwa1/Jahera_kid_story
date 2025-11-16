-- QUICK FIX FOR API KEY ACTIVATION ISSUE
-- Run this SQL in your Supabase SQL Editor to fix the API key activation bug
-- This will allow saved API keys to work immediately

-- Step 1: Fix the set_api_key function to activate keys when saved
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
  INSERT INTO api_keys (key_name, key_value, description, is_active)
  VALUES (p_key_name, p_key_value, p_description, true)
  ON CONFLICT (key_name)
  DO UPDATE SET
    key_value = EXCLUDED.key_value,
    description = COALESCE(EXCLUDED.description, api_keys.description),
    is_active = true,  -- Activate the key when it's updated
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Activate any existing API keys that were previously saved
-- This will activate keys that were already added but weren't working
UPDATE api_keys
SET is_active = true
WHERE key_value != 'your-api-key-here'
  AND key_value IS NOT NULL
  AND key_value != '';

-- Done! Now try generating a story again.
