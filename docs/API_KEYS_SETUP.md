# API Keys Setup Guide

## Overview

Jahera never ships provider API keys inside the app bundle. All AI and voice keys live **server-side** in two places:

1. **Appwrite Functions environment variables** (primary) — used by `generate-story` and `generate-audio`
2. **Appwrite Console → your function → Settings → Variables**

Client code only ever talks to your Appwrite project, never to OpenRouter/Claude/Gemini/ElevenLabs directly.

> ⚠️ **Never** prefix a secret with `EXPO_PUBLIC_`. Everything with that prefix is bundled into the client binary and visible to anyone who downloads the app.

## Required Server Keys

| Variable             | Function       | Purpose                           | Get it from                                            |
| -------------------- | -------------- | --------------------------------- | ------------------------------------------------------ |
| `OPENROUTER_API_KEY` | generate-story | Primary story generation provider | [openrouter.ai](https://openrouter.ai)                 |
| `CLAUDE_API_KEY`     | generate-story | Fallback provider                 | [console.anthropic.com](https://console.anthropic.com) |
| `GEMINI_API_KEY`     | generate-story | Fallback provider                 | [aistudio.google.com](https://aistudio.google.com)     |
| `ELEVENLABS_API_KEY` | generate-audio | Text-to-speech narration          | [elevenlabs.io](https://elevenlabs.io)                 |
| `APPWRITE_API_KEY`   | generate-audio | Writing audio URLs back to the DB | Appwrite Console → Overview → Integrations → API Keys  |

## How to Set Keys

### Appwrite Console (recommended)

1. Open [cloud.appwrite.io](https://cloud.appwrite.io) → your project
2. Go to **Functions → generate-story → Settings → Environment Variables**
3. Add each key listed above
4. Repeat for **generate-audio**
5. Redeploy the function (or toggle _Activate_ on the deployment)

### CLI

```bash
appwrite functions create-variable \
  --function-id generate-story \
  --key OPENROUTER_API_KEY \
  --value sk-or-...
```

### Local development (web-admin only)

For the Next.js admin dashboard, copy `web-admin/.env.local.example` (if present) or create `web-admin/.env.local`:

```bash
ADMIN_PASSWORD=choose-a-strong-password
ELEVENLABS_API_KEY=...
APPWRITE_API_KEY=...
```

Never commit `.env.local`.

## Verifying Keys Work

```bash
# Diagnose the full audio pipeline (DB, buckets, function, variables)
APPWRITE_API_KEY=xxx node infrastructure-scripts/diagnose-audio-pipeline.js

# Check ElevenLabs account + credits
ELEVENLABS_API_KEY=xxx node infrastructure-scripts/check-elevenlabs.js
```

## Rotation & Hygiene Checklist

- [ ] Keys set as function environment variables, not in code
- [ ] No `EXPO_PUBLIC_` secrets anywhere in `.env`
- [ ] No keys in git history (check with `git log -p | grep -i api_key`)
- [ ] Keys rotated at least every 90 days
- [ ] Different keys for dev vs production projects
- [ ] Appwrite API key scoped to the minimum scopes needed (databases.write, storage.write)

## Troubleshooting

### Story generation returns "All providers failed"

1. Check function logs: **Functions → generate-story → Logs**
2. Look for `⚠️ ... API_KEY is missing` — add the variable and redeploy
3. Look for `401/403` errors — the key is invalid, expired, or out of credits

### Audio generation times out

1. Run `diagnose-audio-pipeline.js` (see above)
2. Confirm `APPWRITE_API_KEY` is set — the function needs it to write `audio_url` back to the stories collection
