-- Fix set_api_key function to set is_active = true when saving API keys
-- This ensures that when users add API keys through the UI, they are activated automatically

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
