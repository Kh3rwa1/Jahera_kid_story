# 📚 Jahera - AI-Powered Kids Story App

<div align="center">

**Transform bedtime into an adventure with personalized AI-generated stories for kids aged 4-8**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)]()

</div>

---

## ✨ Premium Features

### 🎨 Production-Ready User Experience
- **Beautiful Gradients** - Modern, colorful UI with smooth gradients and depth
- **Smooth Animations** - Delightful micro-interactions and spring animations
- **Haptic Feedback** - Tactile responses on every interaction
- **Shimmer Loading** - Premium skeleton screens with gradient shimmer
- **Premium Shadows** - Depth and elevation throughout the UI
- **Responsive Design** - Optimized for phones, tablets, and web

### 📖 Core Story Features
- **Very Short Stories** - Perfect for young attention spans (2-3 sentences)
- **AI Story Generation** - Powered by Google Gemini 2.0 Flash
- **Multi-Language Support** - 20 languages with native voice narration
- **Interactive Quizzes** - 3 multiple-choice questions per story
- **Audio Narration** - ElevenLabs text-to-speech in multiple languages
- **Story Library** - Save and replay favorite stories
- **Context-Aware** - Stories adapt to season and time of day
- **Personalized Content** - Features child's name, family, and friends

### 🏆 Gamification & Engagement
- **Achievement System** - 8 unique achievements to unlock
- **Celebration Animations** - Confetti effects for milestones
- **Progress Badges** - Visual rewards with gradient badges
- **Smart App Ratings** - Intelligently timed review prompts
- **Social Sharing** - Share stories and achievements
- **Progress Tracking** - Monitor learning and quiz scores

### 🚀 Enterprise Production Features
- **Analytics Service** - Comprehensive event tracking and user insights
- **Performance Monitoring** - Real-time metrics and health checks
- **Error Tracking** - Centralized error logging with severity levels
- **Smart Caching** - Request caching with TTL support
- **Offline Support** - AsyncStorage persistence for profiles and stories
- **Retry Logic** - Exponential backoff for failed requests
- **Type Safety** - Strict TypeScript throughout
- **Input Validation** - XSS prevention and sanitization
- **Error Boundaries** - Graceful error handling

## 🛠️ Tech Stack

### Frontend
- **React Native 0.81** - Cross-platform mobile framework
- **Expo 54** - Development platform with new architecture
- **TypeScript 5.9** - Type-safe development
- **Expo Router 6** - File-based routing

### Backend & Services
- **Supabase** - PostgreSQL database with real-time capabilities
- **OpenRouter** - AI API gateway (Gemini 2.0 Flash Free)
- **ElevenLabs** - Professional text-to-speech API

### Premium Libraries
- `expo-linear-gradient` - Beautiful gradient backgrounds
- `expo-haptics` - Native haptic feedback
- `expo-blur` - Blur effects for modals
- `react-native-reanimated` - Smooth 60fps animations
- `lucide-react-native` - Beautiful icon system
- `expo-av` - Audio playback and recording

## 📱 Platform Support

- ✅ **iOS** - iPhone & iPad (optimized)
- ✅ **Android** - Phone & Tablet (optimized)
- ✅ **Web** - Responsive web app

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

```bash
# Clone the repository
git clone https://github.com/Kh3rwa1/Jahera_kid_story.git
cd Jahera_kid_story

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your API keys

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
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

## 📂 Project Structure

```
jahera/
├── app/                       # Expo Router screens
│   ├── (tabs)/               # Tab navigation screens
│   │   ├── index.tsx         # Home screen (premium UI)
│   │   ├── history.tsx       # Story library
│   │   └── profile.tsx       # Profile management
│   ├── onboarding/           # Onboarding flow
│   ├── story/                # Story-related screens
│   │   ├── generate.tsx      # Story generation with progress
│   │   ├── playback.tsx      # Audio playback
│   │   └── quiz.tsx          # Interactive quiz
│   └── index.tsx             # Welcome screen
├── components/               # Reusable UI components
│   ├── PremiumButton.tsx     # Enhanced button with haptics
│   ├── PremiumCard.tsx       # Card with gradients & shadows
│   ├── AchievementModal.tsx  # Achievement unlock modal
│   ├── CelebrationOverlay.tsx # Confetti animation
│   ├── LoadingSkeleton.tsx   # Shimmer loading states
│   ├── ErrorBoundary.tsx     # Error boundary
│   └── EmptyState.tsx        # Empty state component
├── services/                 # Backend services
│   ├── achievementService.ts # Achievement tracking
│   ├── analyticsService.ts   # Event analytics
│   ├── cacheService.ts       # Smart caching
│   ├── monitoringService.ts  # Performance monitoring
│   ├── aiService.ts          # Gemini AI integration
│   ├── audioService.ts       # ElevenLabs TTS
│   ├── database.ts           # Supabase operations
│   └── databaseImproved.ts   # Enhanced DB with retry
├── utils/                    # Utility functions
│   ├── haptics.ts            # Haptic feedback helpers
│   ├── animations.ts         # Animation hooks
│   ├── sharing.ts            # Social sharing
│   ├── appRating.ts          # Smart rating prompts
│   ├── errorHandler.ts       # Error handling
│   ├── validation.ts         # Input validation
│   └── storage.ts            # AsyncStorage wrapper
├── constants/                # Theme and config
│   ├── theme.ts              # Premium design system
│   ├── config.ts             # App configuration
│   └── languages.ts          # Supported languages
└── contexts/                 # React contexts
    └── AppContext.tsx        # Global app state
```

## 🎨 Premium Design System

### Colors
- **Primary**: `#FF6634` - Vibrant orange
- **Secondary**: `#FFD93D` - Cheerful yellow
- **Background**: `#FFF8E7` - Warm cream gradient
- **Premium Gradients**: Sunset, Ocean, Magic, Success

### Shadows
```typescript
sm: Subtle depth (2px)
md: Standard elevation (4px)
lg: Prominent lift (8px)
xl: Maximum depth (12px)
colored: Branded shadow with primary color
```

### Animations
```typescript
fast: 200ms   - Micro-interactions
normal: 300ms - Standard transitions
slow: 500ms   - Emphasis animations
verySlow: 800ms - Celebration effects
```

## 🏆 Achievement System

8 achievements to unlock with celebration effects:

1. 📖 **Story Explorer** - Generate your first story
2. 📚 **Avid Reader** - Generate 5 stories
3. 🌟 **Story Master** - Generate 10 stories
4. 🏆 **Quiz Champion** - Get a perfect quiz score
5. 🌍 **World Traveler** - Generate stories in 3 different languages
6. 🌙 **Night Reader** - Generate a story at night
7. 🌅 **Early Bird** - Generate a story in the morning
8. 🔥 **Perfect Streak** - Get 3 perfect quiz scores in a row

## 📊 Analytics & Monitoring

### Tracked Events
- Screen views and navigation
- Story generation (with language and success)
- Quiz completion (with scores)
- User engagement (audio, sharing, achievements)
- Error occurrences (with context)
- Performance metrics (API calls, loading times)

### Performance Monitoring
- Real-time performance metrics
- API call tracking
- Error severity levels
- Health status checks

### Caching Strategy
- Smart TTL-based caching
- Memory + AsyncStorage persistence
- Cache invalidation by prefix
- Get-or-fetch pattern

## 🧪 Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build for web
npm run build:web
```

## 📦 Production Deployment

See **[PUBLISHING.md](./PUBLISHING.md)** for comprehensive app store publishing guide.

### Quick Deploy

```bash
# iOS
eas build --platform ios --profile production-store

# Android
eas build --platform android --profile production-store

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

### Quality Assurance

Before publishing, complete the **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** with 200+ test cases covering:
- Core functionality (story generation, audio, quiz)
- UI/UX quality (animations, design, responsiveness)
- Error handling (blank screens, API failures)
- Performance (load times, memory, battery)
- Security and privacy
- Accessibility (WCAG AA compliance)
- Cross-platform compatibility

## 📚 Supported Languages

20 languages with native voice narration:
- English, Spanish, French, German, Italian
- Portuguese, Russian, Chinese, Japanese, Korean
- Arabic, Hindi, Turkish, Polish, Dutch
- Swedish, Norwegian, Danish, Finnish, Greek

## 💡 Cost Optimization

- **Free-Tier APIs**: Uses Gemini 2.0 Flash Free model
- **Audio Caching**: Stories generated once and cached locally
- **Smart Caching**: Reduces redundant API calls
- **Efficient Storage**: Compressed MP3 format
- **Short Stories**: 2-3 sentences minimize token usage

## 🎯 Database Schema

### Core Tables
- `profiles` - Child profile with personalization
- `user_languages` - Selected languages (up to 4)
- `family_members` - Family member names
- `friends` - Friend names
- `stories` - Generated stories with metadata

### Quiz Tables
- `quiz_questions` - 3 questions per story
- `quiz_answers` - Multiple-choice options (A, B, C)
- `quiz_attempts` - Score tracking and history

### Production Tables
- `api_keys` - Secure API key storage

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **Google Gemini** - AI story generation
- **ElevenLabs** - Professional voice narration
- **Supabase** - Database infrastructure
- **Expo** - Development platform
- **OpenRouter** - AI API gateway

## 📞 Support

- 📧 Email: support@jahera.app
- 🐛 Issues: [GitHub Issues](https://github.com/Kh3rwa1/Jahera_kid_story/issues)
- 📖 Docs: See PRODUCTION.md and ARCHITECTURE.md

## 🌟 What's New in v1.0

### AAA+ Quality Updates
- ✅ **Fixed blank screen issue** - Proper error handling during story generation
- ✅ **Audio generation improvements** - Retry mechanism with exponential backoff
- ✅ **Story regeneration** - Generate new stories from playback screen
- ✅ **Enhanced error messages** - User-friendly error states with retry options
- ✅ **Graceful audio fallback** - Stories work even if audio fails
- ✅ **Auto-show text** - Story text displays automatically when audio unavailable
- ✅ **Production-ready build** - EAS configuration for app store publishing
- ✅ **Comprehensive testing** - 200+ test cases for quality assurance

### Premium Features
- ✅ Premium UI with gradients and shadows
- ✅ Smooth animations and haptic feedback
- ✅ Achievement system with celebrations
- ✅ Analytics and performance monitoring
- ✅ Smart caching and offline support
- ✅ App rating prompts
- ✅ Social sharing features
- ✅ Production-ready error handling

---

<div align="center">

**Made with ❤️ for kids everywhere**

Built to look like a $5M VC-funded startup 🚀

</div>
