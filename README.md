# 📚 Jahera - AI-Powered Kids Story App

Jahera is a React Native + Expo app that creates personalized, multilingual bedtime stories for children with parent-first controls, behavior learning goals, voice personas, and privacy-safe onboarding.

## ✨ Features

### 🧠 Smart Story Engine
- **Behavior-Driven Stories**: 12 learning goals (confidence, sharing, kindness, courage, discipline, etc.) backed by bibliotherapy research
- **Parent Control Panel**: Choose behavior goal → theme → mood → duration → voice
- **Voice Presets**: Mom, Dad, Grandma, Fun Narrator, Hindi Dadi personas via ElevenLabs
- **Bedtime Reminders**: Daily push notifications with custom time picker
- **Behavior Progress Tracking**: 30-day visual progress of learning goals
- **Parent Consent Gate**: COPPA/DPDP compliant onboarding
- **Privacy-Safe Location**: Manual city input (no GPS) for story personalization
- **Prompt Security**: Input sanitization against prompt injection

### 📖 Core Product Highlights
- AI-generated adventure stories tailored to child profile context
- Interactive quiz generation for comprehension
- Multilingual narration and reading playback
- Story history and replay

## 🛠️ Tech Stack
- **Frontend**: React Native 0.81, Expo SDK 54, Expo Router, TypeScript 5.9
- **Backend**: Appwrite (Database, Auth, Cloud Functions)
- **AI**: Google Gemini 2.0 Flash via OpenRouter
- **Voice**: ElevenLabs Text-to-Speech (24 languages)
- **Subscriptions**: RevenueCat
- **Analytics**: Custom analytics service
- **Notifications**: expo-notifications

## 🚀 Getting Started

```bash
git clone https://github.com/Kh3rwa1/Jahera_kid_story.git
cd Jahera_kid_story
npm install
npm run dev
```

## 🔐 .env Template

```bash
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
```

Create an Appwrite project at: https://appwrite.io/

## 📂 Project Structure

```text
jahera/
├── constants/
│   ├── behaviorGoals.ts           # 12 behavior learning goals
│   ├── voicePresets.ts            # Voice persona configurations
│   ├── indianCities.ts            # 30 popular Indian cities
├── components/
│   ├── BehaviorGoalPicker.tsx     # Goal selection UI
│   ├── VoicePresetPicker.tsx      # Voice persona picker
│   ├── BehaviorProgressCard.tsx   # Progress visualization
│   ├── ParentConsentGate.tsx      # Consent checkboxes
├── utils/
│   ├── behaviorProgress.ts        # Progress computation
│   ├── promptSanitizer.ts         # Input sanitization
├── app/
│   ├── onboarding/consent.tsx     # Consent screen
│   ├── settings/notifications.tsx # Bedtime reminder settings
```

## Privacy & Compliance
- **No GPS data collected** — location is manually entered by parents
- **Parent-first architecture** — parent is the sole account holder
- **Consent gate** — verifiable parental consent at onboarding
- **No child accounts** — all data stored under parent profile
- **Input sanitization** — all user strings cleaned before AI processing
- **COPPA (US) and DPDP (India) considerations** built into the design

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a pull request

## 📄 License
MIT
