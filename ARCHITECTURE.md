# Jahera — Architecture

## Overview

Jahera is a React Native (Expo SDK 54) app that generates personalized, AI-powered children's stories with multilingual voice narration, behavior-driven learning goals, and interactive quizzes.

- **Backend:** Appwrite Cloud (Auth, Databases, Storage, Functions)
- **AI:** OpenRouter (Gemini 2.0 Flash) → Claude → Gemini → Pollinations failover chain
- **Voice:** ElevenLabs multilingual v2 → Edge TTS fallback
- **Subscriptions:** RevenueCat

## Layer Diagram

```text
┌──────────────────────────────────────────────────────┐
│ Presentation — Expo Router (file-based)              │
│   app/(tabs) · app/story · app/onboarding · app/auth │
│   components/ (pickers, skeletons, error states)     │
├──────────────────────────────────────────────────────┤
│ State — React Contexts                               │
│   AuthContext (Appwrite account + OAuth)             │
│   AppContext (profile, stories, subscription, streak)│
│   ThemeContext · AudioContext · UIContext · Reading  │
├──────────────────────────────────────────────────────┤
│ Hooks — useStoryGeneration, usePlayback,             │
│   useNarrationAudio, useWordHighlighting,            │
│   useOfflineStories, useAsyncData, usePurchase       │
├──────────────────────────────────────────────────────┤
│ Services — business logic                            │
│   aiService → Appwrite Function: generate-story      │
│   audioService → Appwrite Function: generate-audio   │
│   database · offlineStoryService · cacheService      │
│   subscriptionService · revenueCatServiceInternal    │
├──────────────────────────────────────────────────────┤
│ Data — Appwrite Cloud · AsyncStorage (offline cache) │
└──────────────────────────────────────────────────────┘
```

## AI Story Generation Pipeline

1. **Client** (`services/aiService.ts`) sanitizes profile fields (`utils/promptSanitizer.ts`), then executes the `generate-story` Appwrite Function.
2. **Server** (`appwrite/functions/generate-story/index.js`):
   - Loads prompt config (system prompt, themes, moods, lengths, behavior goals) from the `config` collection, falling back to built-in defaults.
   - Builds the prompt and tries the provider chain: **OpenRouter → Claude → Gemini → Pollinations**.
   - Runs a server-side safety check (blocklist + phrases). On failure it retries with a stricter prompt, then falls back to a pre-approved story.
3. **Client** re-checks the returned story with `utils/storySafetyFilter.ts`. On failure: retry, then a bank of 20 pre-approved fallback stories.

Three independent safety layers (input sanitizer, server filter, client filter) protect against prompt injection and unsafe output.

## Audio Pipeline

1. `services/audioService.ts` triggers `generate-audio` with `{ text, languageCode, storyId }`.
2. The function computes a deterministic file ID (hash of text + language + cache version + voice settings) so identical requests hit the storage cache.
3. **ElevenLabs** is tried first (per-language support lists); **Edge TTS** is the free fallback.
4. Audio is uploaded to the `story-audio` bucket and `audio_url` is written to the story document.
5. The client polls the story document (sync mode returns base64 for short narrations) because async executions return empty bodies through the client SDK.

## Offline-First Strategy

- `AppContext.loadProfile()` renders from AsyncStorage cache immediately, then syncs in the background.
- `services/offlineStoryService.ts` auto-caches stories that have audio; `hooks/useOfflineStories.ts` exposes CRUD for offline stories.
- On fetch failure, story lists fall back to the offline cache.

## Security Model

- Provider API keys live only in Appwrite Function environment variables — never in the client bundle (no `EXPO_PUBLIC_` secrets).
- Parent-first accounts: consent gate + PIN gate (`utils/pinSecurity.ts`), no child accounts (COPPA/DPDP-oriented design).
- All user strings passed to AI prompts are length-capped and pattern-stripped (`utils/promptSanitizer.ts`, mirrored server-side).
- Session persistence via AsyncStorage with background revalidation against `account.get()`.

## Web Admin Dashboard

`web-admin/` is a Next.js 16 (App Router) + Tailwind 4 dashboard that talks to Appwrite with a server API key.

- All admin routes guard through `requireAdminRequest()` (`src/lib/adminAuth.ts`) — Basic auth against `ADMIN_PASSWORD`, enforced in production, plus localhost bypass for dev.
- Server routes under `src/app/api/` proxy Appwrite operations (audio assembly, prompts, habits) so the Appwrite key never reaches the browser.

## Testing

- **Jest + jest-expo + Testing Library** — 14 suites covering validation, safety filters, sanitizer, storage, error handler, cache service, database services, playback/generation hooks, and ThemeContext.
- **CI** (`.github/workflows/ci.yml`): lint, typecheck (`tsc --noEmit`), prettier, secret scan, unit tests, and an Expo web export check.

## Key Directories

| Path                  | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `app/`                | Expo Router screens                                       |
| `components/`         | Reusable UI (ErrorBoundary, LoadingSkeleton, pickers)     |
| `contexts/`           | Global state providers                                    |
| `hooks/`              | Reusable behavior (playback, generation, offline)         |
| `services/`           | API clients and business logic                            |
| `utils/`              | Validation, sanitization, safety filters, storage, logger |
| `appwrite/functions/` | Serverless generate-story / generate-audio                |
| `web-admin/`          | Next.js admin dashboard                                   |
| `scripts/`            | Seeding and deploy automation                             |
