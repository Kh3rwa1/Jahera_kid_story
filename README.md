# Story & Quiz Adventures - AI-Powered Interactive Stories for Kids

A multilingual, AI-powered mobile app that generates very short, personalized stories (2-3 sentences) for children aged 4-8, followed by interactive quizzes. Built with Expo, React Native, Supabase, and powered by Google's Gemini AI and ElevenLabs text-to-speech.

## Features

- **Very Short Stories**: Perfect for young attention spans (2-3 sentences only)
- **Interactive Quizzes**: 3 multiple-choice questions after each story
- **Multi-language Support**: Select up to 4 languages during onboarding
- **Personalized Content**: Stories feature the child's name, family members, and friends
- **AI-Generated**: Each story and quiz is unique, created by Gemini AI
- **Audio Narration**: Professional multi-language voice narration via ElevenLabs
- **Colorful, Kid-Friendly UI**: Bright, playful design with large buttons and engaging visuals
- **Progress Tracking**: Track quiz scores and story history
- **Context-Aware**: Stories adapt to the current season and time of day

## Tech Stack

- **Frontend**: React Native + Expo (SDK 54)
- **Database**: Supabase (PostgreSQL)
- **AI Story & Quiz Generation**: Google Gemini 2.0 Flash (via OpenRouter)
- **Text-to-Speech**: ElevenLabs API
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage + File System

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v18 or higher)
2. npm or yarn
3. Expo CLI (`npm install -g expo-cli`)
4. A Supabase account
5. An OpenRouter API key (for Gemini access)
6. An ElevenLabs API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with your API keys:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

#### Getting API Keys

**Supabase:**
- Already configured in your project
- Database schema is automatically set up via migrations

**OpenRouter (for Gemini AI):**
1. Sign up at [https://openrouter.ai](https://openrouter.ai)
2. Add credits to your account (Gemini 2.0 Flash Free model is used)
3. Generate an API key from the dashboard

**ElevenLabs:**
1. Sign up at [https://elevenlabs.io](https://elevenlabs.io)
2. Free tier includes 10,000 characters per month
3. Generate an API key from your profile settings

### 3. Database Setup

The database is already configured! The migrations have been applied automatically with the following tables:

- `profiles` - Stores child profile information
- `user_languages` - Manages selected languages (up to 4)
- `family_members` - Stores family member names
- `friends` - Stores friend names
- `stories` - Saves generated stories with audio references
- `quiz_questions` - Stores quiz questions for each story
- `quiz_answers` - Stores answer options (A, B, C) and correct answers
- `quiz_attempts` - Tracks quiz scores and attempts

## Running the App

### Web Development

```bash
npm run dev
```

Then open [http://localhost:8081](http://localhost:8081) in your browser.

### Build for Production

```bash
npm run build:web
```

## App Structure

```
app/
├── (tabs)/                    # Main app screens (after onboarding)
│   ├── index.tsx             # Home screen with story generation
│   ├── history.tsx           # Story history with language filtering
│   └── profile.tsx           # Profile management
├── onboarding/               # Onboarding flow
│   ├── language-selection.tsx
│   ├── kid-name.tsx
│   ├── family-members.tsx
│   └── friends.tsx
├── story/                    # Story-related screens
│   ├── generate.tsx          # Story & quiz generation progress
│   ├── playback.tsx          # Audio playback with "Start Quiz" button
│   └── quiz.tsx              # Interactive quiz screen
└── index.tsx                 # Welcome screen

services/
├── database.ts               # Supabase database operations
├── aiService.ts             # Gemini AI story & quiz generation
└── audioService.ts          # ElevenLabs audio generation

utils/
├── contextUtils.ts          # Season and time detection
└── languageUtils.ts         # Language helper functions

constants/
└── languages.ts             # Supported languages configuration
```

## How It Works

### 1. Onboarding Flow

1. **Language Selection**: Choose up to 4 languages for story generation
2. **Child's Name**: Enter the child's name (main character)
3. **Family Members**: Add family members who may appear in stories (optional)
4. **Friends**: Add friends who may appear in stories (optional)

### 2. Story & Quiz Generation

When generating a story:

1. App detects current season and time of day
2. Retrieves child profile with family and friends
3. Sends contextual prompt to Gemini AI requesting:
   - A 2-3 sentence story (very short for ages 4-8)
   - 3 multiple-choice quiz questions with A, B, C options
   - Simple vocabulary and positive themes
4. Gemini generates the story and quiz in selected language
5. Story is sent to ElevenLabs for audio narration
6. Audio file is cached locally for replay
7. Story, quiz questions, and audio are saved to database

### 3. Story Playback

- Listen to the audio narration
- Show/hide story text
- Play/pause/restart controls
- Background audio support
- **Start Quiz button** to begin the interactive quiz

### 4. Interactive Quiz

- 3 multiple-choice questions per story
- Large, colorful buttons (A, B, C) with distinct colors
- Visual feedback (checkmarks for correct, X for wrong)
- Score tracking with encouraging messages
- Results screen with percentage and motivational text
- Progress saved to database

## Supported Languages

The app supports 20 languages with native voice narration:

- English, Spanish, French, German, Italian
- Portuguese, Russian, Chinese, Japanese, Korean
- Arabic, Hindi, Turkish, Polish, Dutch
- Swedish, Norwegian, Danish, Finnish, Greek

## Cost Optimization Features

- **Free-Tier APIs**: Uses Gemini 2.0 Flash Free model
- **Audio Caching**: Stories are generated once and cached locally
- **No External Services**: Weather/location are AI-generated based on season
- **Efficient Storage**: Audio files use compressed MP3 format
- **Short Stories**: 2-3 sentences minimize API token usage

## Database Schema

### Quiz Tables (New!)

#### Quiz Questions Table
- `id`: UUID (primary key)
- `story_id`: UUID (foreign key to stories)
- `question_text`: Text
- `question_order`: Integer (1, 2, or 3)

#### Quiz Answers Table
- `id`: UUID (primary key)
- `question_id`: UUID (foreign key to quiz_questions)
- `answer_text`: Text
- `is_correct`: Boolean
- `answer_order`: Text ('A', 'B', or 'C')

#### Quiz Attempts Table
- `id`: UUID (primary key)
- `profile_id`: UUID (foreign key to profiles)
- `story_id`: UUID (foreign key to stories)
- `score`: Integer (0-3)
- `total_questions`: Integer (always 3)
- `completed_at`: Timestamp

## Design Philosophy

The app features a vibrant, colorful design specifically tailored for young children (ages 4-8):

- **Warm Color Palette**: Orange (#FF6B35), yellow (#FFD93D), and cream backgrounds
- **Large, Rounded Elements**: Easy for small hands to tap
- **Playful Fonts**: Large, bold text that's easy to read
- **Visual Feedback**: Animations and color changes for every interaction
- **Encouraging Messages**: Positive reinforcement throughout
- **Simple Navigation**: Minimal complexity, intuitive flow

## Troubleshooting

### Stories Not Generating

1. Check your OpenRouter API key is correct
2. Ensure you have credits in your OpenRouter account
3. Check console logs for detailed error messages
4. Verify the prompt is requesting quiz questions

### Quiz Not Appearing

1. Ensure story generation completed successfully
2. Check that quiz questions were saved to database
3. Verify the "Start Quiz" button appears on playback screen

### Audio Not Playing

1. Verify ElevenLabs API key is correct
2. Check free tier limits (10,000 characters/month)
3. Ensure file system permissions are granted

### Database Issues

1. Verify Supabase URL and anon key
2. Check Supabase dashboard for connection errors
3. Ensure all migrations were applied successfully
4. Verify quiz tables exist in database

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions, please open an issue on the project repository.

---

Built with ❤️ for creating fun, educational moments for children through personalized storytelling and interactive quizzes.
