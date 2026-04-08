# Publishing Guide for Jahera

This guide walks you through publishing Jahera to the Apple App Store and Google Play Store.

## Prerequisites

### Required Accounts
- [ ] Expo account (https://expo.dev/signup)
- [ ] Apple Developer Account ($99/year) (https://developer.apple.com)
- [ ] Google Play Developer Account ($25 one-time) (https://play.google.com/console)
- [ ] Appwrite account (https://sfo.cloud.appwrite.io)
- [ ] OpenAI/OpenRouter API key
- [ ] ElevenLabs API key
- [ ] RevenueCat account for subscriptions

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

## Pre-Publishing Checklist

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite project endpoint
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID`: Your Appwrite database ID (e.g., jahera_db)
- `EXPO_PUBLIC_APPWRITE_PLATFORM`: Your app bundle ID (e.g., com.hindi.harp)

### 2. Update App Version
Update version in `app.json`:
- `version`: App version (e.g., "1.0.0")
- `ios.buildNumber`: iOS build number (e.g., "1.0.0")
- `android.versionCode`: Android version code (increment for each release)

### 3. Verify App Assets
Ensure all required assets exist:
- [ ] `assets/images/icon.png` (1024x1024px)
- [ ] `assets/images/splash.png` (recommended 1284x2778px)
- [ ] `assets/images/adaptive-icon.png` (Android, 1024x1024px)
- [ ] `assets/images/favicon.png` (Web, 48x48px)

### 4. Test API Keys
Test that API keys work in the app:
- [ ] Add OpenAI/OpenRouter API key in Profile → Manage API Keys
- [ ] Add ElevenLabs API key in Profile → Manage API Keys
- [ ] Generate a test story with audio narration
- [ ] Verify quiz generation works
- [ ] Test audio playback

### 5. Test All Flows
- [ ] Onboarding flow completes successfully
- [ ] Profile creation works with family members and friends
- [ ] Story generation works (with progress tracking)
- [ ] Audio narration generates successfully
- [ ] Story playback works with audio controls
- [ ] Quiz functionality works correctly
- [ ] Story regeneration creates new stories
- [ ] History shows all generated stories
- [ ] Profile page displays correctly
- [ ] Error states show user-friendly messages
- [ ] Blank screen issue is fixed (proper error handling)

## Building for Production

### Configure EAS Project
```bash
eas init
```

This creates a project in your Expo account and links it to your local project.

### Update EAS Configuration
Edit `eas.json` and update the `submit.production` section with your credentials:

**iOS:**
- `appleId`: Your Apple ID email
- `ascAppId`: App Store Connect app ID (get from App Store Connect)
- `appleTeamId`: Your Apple Team ID (get from Apple Developer portal)

**Android:**
- Generate a service account key in Google Play Console
- Save as `android-service-account.json`
- Update `serviceAccountKeyPath` in `eas.json`

### Build for iOS

#### Preview Build (Internal Testing)
```bash
eas build --platform ios --profile preview
```

#### Production Build (App Store)
```bash
eas build --platform ios --profile production-store
```

### Build for Android

#### Preview Build (APK for Testing)
```bash
eas build --platform android --profile preview
```

#### Production Build (AAB for Play Store)
```bash
eas build --platform android --profile production-store
```

### Build for Both Platforms
```bash
eas build --platform all --profile production-store
```

## Submitting to App Stores

### iOS - Apple App Store

#### 1. Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Name: Jahera
   - Primary Language: English
   - Bundle ID: com.jahera.kids
   - SKU: jahera-kids-stories
   - User Access: Full Access

#### 2. Prepare App Store Listing
Required information:
- **App Name**: Jahera
- **Subtitle**: AI Personalized Story Adventures
- **Description**: See below for suggested description
- **Keywords**: kids stories, ai stories, personalized stories, educational, reading, children
- **Support URL**: Your website or support page
- **Marketing URL**: Your website (optional)
- **Privacy Policy URL**: Required - create privacy policy

Screenshots required (per device size):
- 6.5" iPhone (1284x2778px): 3-10 screenshots
- 12.9" iPad Pro (2048x2732px): 3-10 screenshots

#### 3. Submit Build
```bash
eas submit --platform ios --latest
```

Or manually upload via App Store Connect.

#### 4. App Review Information
Provide demo account credentials if needed for app review.

---

### Android - Google Play Store

#### 1. Create App in Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details:
   - App name: Jahera
   - Default language: English
   - App or game: App
   - Free or paid: Free
   - Developer Program Policies: Accept

#### 2. Prepare Store Listing
Required information:
- **App name**: Jahera
- **Short description**: AI-powered personalized story adventures for kids
- **Full description**: See below for suggested description
- **App icon**: 512x512px PNG
- **Feature graphic**: 1024x500px PNG
- **Screenshots**: At least 2 screenshots (phone and tablet)
- **Privacy policy**: Required - create privacy policy

#### 3. Content Rating
Complete the content rating questionnaire:
- Target audience: Children
- Select appropriate age groups
- Answer questions about content

#### 4. Submit Build
```bash
eas submit --platform android --latest
```

Or manually upload AAB file in Play Console.

#### 5. Release
1. Choose release track: Internal testing → Closed testing → Open testing → Production
2. Start with Internal testing, then gradually promote
3. Add release notes

---

## Suggested App Description

### Short Description (80 characters)
AI-powered personalized story adventures tailored for your child

### Full Description

**Jahera - Magical Personalized Stories for Kids**

Transform storytime into an enchanting adventure with Jahera! Our AI-powered app creates personalized stories featuring your child, their family members, and friends in educational adventures they'll love.

**✨ Features:**

**🎭 Personalized Adventures**
- Stories tailored to your child's profile
- Include family members and friends as characters
- Adapts to seasons and time of day for relevant storytelling

**🗣️ Multilingual Narration**
- Professional AI voice narration in 20+ languages
- Perfect for bilingual families and language learning
- English, Spanish, French, German, Italian, Portuguese, and more!

**📚 Educational & Fun**
- Interactive quizzes test comprehension
- Age-appropriate content
- Develops reading and listening skills

**🎨 Beautiful Design**
- Modern, kid-friendly interface
- Smooth animations and interactions
- Distraction-free reading experience

**📖 Story Library**
- Save and revisit favorite stories
- Track reading progress
- Generate unlimited new adventures

**🔒 Safe & Secure**
- No ads or in-app purchases
- Child-safe content
- Privacy-focused design

**Perfect for:**
- Bedtime stories
- Educational screen time
- Language learning
- Building reading habits
- Traveling families

**How it works:**
1. Create your child's profile
2. Add family members and friends
3. Generate personalized story adventures
4. Listen to narration or read together
5. Complete interactive quizzes

Make storytime magical with Jahera!

**Note:** Requires API keys for story and audio generation (OpenAI/OpenRouter and ElevenLabs). Instructions provided in the app.

---

## Privacy Policy Requirements

You MUST create a privacy policy before publishing. Include:

- Data collection practices
- How user data is stored (Appwrite)
- Third-party services used (OpenAI, ElevenLabs)
- User rights and data deletion
- Contact information

Recommended tools:
- https://www.privacypolicies.com
- https://app-privacy-policy-generator.firebaseapp.com

---

## Post-Launch Checklist

### Monitoring
- [ ] Set up crash reporting (Sentry, Bugsnag)
- [ ] Monitor app reviews
- [ ] Track analytics (Expo Analytics, Mixpanel)
- [ ] Monitor API usage and costs

### Marketing
- [ ] Create landing page
- [ ] Prepare social media posts
- [ ] App Store Optimization (ASO)
- [ ] Request user reviews

### Updates
- [ ] Plan regular updates
- [ ] Fix bugs reported by users
- [ ] Add new features based on feedback
- [ ] Keep dependencies updated

---

## Troubleshooting

### Build Fails
- Check `eas build --platform [ios|android] --profile production-store` logs
- Ensure all dependencies are compatible
- Verify app.json and eas.json are valid JSON

### Submission Rejected
- Review rejection reason carefully
- Common issues:
  - Missing privacy policy
  - Incomplete metadata
  - App crashes on launch
  - Missing required device screenshots

### Audio Generation Not Working
- Verify ElevenLabs API key is valid
- Check API quota/billing
- Test with different languages

### Story Generation Fails
- Verify OpenAI/OpenRouter API key
- Check API quota and billing
- Review Appwrite function logs

---

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Email: [Your support email]
- Documentation: [Your docs URL]

---

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [Appwrite Documentation](https://appwrite.io/docs)
