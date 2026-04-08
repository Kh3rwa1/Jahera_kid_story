import { Platform } from 'react-native';
import { Account,Client,Databases,Functions,Storage } from 'react-native-appwrite';

// Fail-fast if required env vars are missing — never ship hardcoded credentials
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!ENDPOINT || !PROJECT_ID) {
  throw new Error(
    '[Jahera] Missing required environment variables: EXPO_PUBLIC_APPWRITE_ENDPOINT and EXPO_PUBLIC_APPWRITE_PROJECT_ID must be set. See .env.example.'
  );
}

const clientBuilder = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

if (Platform.OS !== 'web') {
  const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM;
  if (!platform) {
    throw new Error('[Jahera] EXPO_PUBLIC_APPWRITE_PLATFORM must be set for native builds. See .env.example.');
  }
  clientBuilder.setPlatform(platform);
}

export const client = clientBuilder;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
if (!dbId) {
  throw new Error('[Jahera] EXPO_PUBLIC_APPWRITE_DATABASE_ID must be set. See .env.example.');
}
export const DATABASE_ID = dbId;
export const APPWRITE_ENDPOINT = ENDPOINT;
export const APPWRITE_PROJECT_ID = PROJECT_ID;

export const COLLECTIONS = {
  PROFILES: 'profiles',
  USER_LANGUAGES: 'user_languages',
  FAMILY_MEMBERS: 'family_members',
  FRIENDS: 'friends',
  STORIES: 'stories',
  QUIZ_QUESTIONS: 'quiz_questions',
  QUIZ_ANSWERS: 'quiz_answers',
  QUIZ_ATTEMPTS: 'quiz_attempts',
  API_KEYS: 'api_keys',
  SUBSCRIPTIONS: 'subscriptions',
  STREAKS: 'streaks',
  PROFILE_INTERESTS: 'profile_interests',
  CONFIG: 'config',
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  APP_ASSETS: 'app_assets',
} as const;

export { ID, Query } from 'react-native-appwrite';
