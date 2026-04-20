# API Keys Setup Guide

## Overview

API keys are now stored securely in the Supabase database instead of environment variables. This provides better security and allows for dynamic updates without redeployment.

## Database Structure

### API Keys Table

```sql
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Security Features

- **Row Level Security (RLS)** enabled - prevents direct client access
- **Secure Functions** - API keys accessed only via `SECURITY DEFINER` functions
- **Server-side only** - Keys never exposed to client code
- **Encrypted storage** - Store keys with database encryption

## Available API Keys

### 1. OpenAI API Key

- **Key Name:** `openai_api_key`
- **Purpose:** Story generation via OpenRouter
- **Format:** `sk-...` (starts with 'sk-' and is 20+ characters)
- **Get yours:** [openrouter.ai](https://openrouter.ai)

### 2. ElevenLabs API Key

- **Key Name:** `elevenlabs_api_key`
- **Purpose:** Text-to-speech audio generation
- **Format:** 20+ character string
- **Get yours:** [elevenlabs.io](https://elevenlabs.io)

## How to Set Up API Keys

### Method 1: Using the App UI (Recommended)

1. Open the app
2. Navigate to **Profile** tab
3. Tap **Manage API Keys** button
4. Enter your API keys
5. Tap **Save API Keys**

### Method 2: Using Supabase SQL Editor

```sql
-- Set OpenAI API Key
SELECT set_api_key(
  'openai_api_key',
  'your-actual-api-key-here',
  'OpenAI API key for story generation'
);

-- Set ElevenLabs API Key
SELECT set_api_key(
  'elevenlabs_api_key',
  'your-actual-api-key-here',
  'ElevenLabs API key for text-to-speech'
);
```

### Method 3: Using Supabase Client (Server-side)

```typescript
import { supabase } from '@/lib/supabase';

await supabase.rpc('set_api_key', {
  p_key_name: 'openai_api_key',
  p_key_value: 'your-actual-api-key-here',
  p_description: 'OpenAI API key for story generation',
});
```

## Using API Keys in Code

### Getting an API Key

```typescript
import { apiKeysService } from '@/services/apiKeysService';

// Get OpenAI key
const openaiKey = await apiKeysService.getOpenAIKey();

// Get ElevenLabs key
const elevenlabsKey = await apiKeysService.getElevenLabsKey();

// Get any key by name
const customKey = await apiKeysService.getApiKey('custom_key_name');
```

### Validating an API Key

```typescript
import { apiKeysService } from '@/services/apiKeysService';

const isValid = apiKeysService.validateApiKey('openai_api_key', apiKey);
if (!isValid) {
  throw new Error('Invalid API key format');
}
```

### Masking an API Key for Display

```typescript
import { apiKeysService } from '@/services/apiKeysService';

const maskedKey = apiKeysService.maskApiKey('sk-1234567890abcdefghij');
// Returns: "sk-1••••••••ghij"
```

## Database Functions

### get_api_key(p_key_name text)

Retrieves an active API key by name.

```sql
SELECT get_api_key('openai_api_key');
```

**Returns:** The API key value (text) or NULL if not found/inactive

**Security:** SECURITY DEFINER - bypasses RLS, server-side only

### set_api_key(p_key_name, p_key_value, p_description)

Creates or updates an API key.

```sql
SELECT set_api_key(
  'openai_api_key',
  'sk-your-key-here',
  'OpenAI API key for story generation'
);
```

**Returns:** The UUID of the created/updated key

**Security:** SECURITY DEFINER - bypasses RLS, server-side only

## Security Best Practices

### ✅ DO

- Store API keys in the database using the provided functions
- Access keys only server-side (Edge Functions, secure API routes)
- Validate key format before saving
- Use masked keys when displaying to users
- Keep keys marked as `is_active = true` only when in use
- Rotate keys regularly
- Use environment variables only for the Supabase connection itself

### ❌ DON'T

- Don't expose API keys in client-side code
- Don't log API keys in console or error messages
- Don't commit API keys to version control
- Don't share API keys between environments
- Don't query the `api_keys` table directly from the client
- Don't store unencrypted keys in local storage

## Troubleshooting

### Error: "OpenAI API key not configured"

**Solution:**

1. Go to Profile → Manage API Keys
2. Add your OpenRouter API key
3. Make sure it starts with 'sk-'
4. Verify it's marked as active in the database

### Error: "Failed to get API key"

**Solution:**

1. Check database connection
2. Verify RLS policies are correctly set
3. Ensure you're using the secure functions, not direct queries
4. Check that `is_active = true` in the database

### Keys Not Saving

**Solution:**

1. Check network connection
2. Verify Supabase connection is working
3. Check browser/app console for errors
4. Verify the key format is valid

### Invalid API Key Format

**Solution:**

- **OpenAI:** Must start with 'sk-' and be 20+ characters
- **ElevenLabs:** Must be 20+ characters
- Check for extra spaces or newlines
- Copy key directly from the provider

## Migration from Environment Variables

If you were previously using environment variables:

### Before (Environment Variables)

```typescript
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
```

### After (Database)

```typescript
const apiKey = await apiKeysService.getOpenAIKey();
```

### Migration Steps

1. Create the API keys table (migration already applied)
2. Add your API keys via the UI or SQL
3. Update code to use `apiKeysService`
4. Remove environment variables from `.env`
5. Test thoroughly

## Testing

### Test API Key Retrieval

```typescript
import { apiKeysService } from '@/services/apiKeysService';

async function testApiKeys() {
  try {
    const openaiKey = await apiKeysService.getOpenAIKey();
    console.log('OpenAI Key:', openaiKey ? 'Found' : 'Not found');

    const isValid = apiKeysService.validateApiKey('openai_api_key', openaiKey);
    console.log('Valid:', isValid);

    const masked = apiKeysService.maskApiKey(openaiKey);
    console.log('Masked:', masked);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Test in Development

1. Set up API keys in development database
2. Generate a test story
3. Check console for API key errors
4. Verify story generation works

### Test in Production

1. Set up production API keys
2. Monitor error rates
3. Set up alerts for API key failures
4. Regular key rotation schedule

## Monitoring

### Recommended Monitoring

- Track API key usage (add logging to functions)
- Monitor failed key validations
- Alert on missing/invalid keys
- Track key rotation dates

### Example Logging

```typescript
async function generateStory() {
  const apiKey = await apiKeysService.getOpenAIKey();

  if (!apiKey) {
    console.error('[API Keys] OpenAI key not found');
    // Send to monitoring service
  }

  if (!apiKeysService.validateApiKey('openai_api_key', apiKey)) {
    console.error('[API Keys] OpenAI key invalid format');
    // Send to monitoring service
  }
}
```

## Future Enhancements

- [ ] Add key expiration dates
- [ ] Implement key usage tracking
- [ ] Add key rotation reminders
- [ ] Support multiple keys per service (load balancing)
- [ ] Add key encryption at rest
- [ ] Implement key access audit logs
- [ ] Add webhook for key updates

## Support

For issues or questions:

1. Check this documentation
2. Review error messages in console
3. Verify database migration is applied
4. Check Supabase dashboard for RLS policies
5. Contact development team

---

**Last Updated:** 2024-11-16
**Version:** 1.0.0
