import { Platform } from 'react-native';
import { Account,Client,Databases,Functions,Storage } from 'react-native-appwrite';

const REQUIRED_APPWRITE_VARS = [
  'EXPO_PUBLIC_APPWRITE_ENDPOINT',
  'EXPO_PUBLIC_APPWRITE_PROJECT_ID',
] as const;

const missingRequiredVars = REQUIRED_APPWRITE_VARS.filter((name) => !process.env[name]);

if (missingRequiredVars.length > 0) {
  throw new Error(
    `[Jahera] Missing required environment variables: ${missingRequiredVars.join(', ')}. ` +
      'Create a .env file from .env.example, ensure keys use the EXPO_PUBLIC_ prefix, and restart Metro/dev client after saving .env.'
  );
}

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT as string;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string;

const clientBuilder = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

if (Platform.OS !== 'web') {
  const platform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM;
  if (!platform) {
    throw new Error(
      '[Jahera] EXPO_PUBLIC_APPWRITE_PLATFORM must be set for native builds. Set it to your app package id (example: com.hindi.harp) in .env, then rebuild the native app.'
    );
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
  throw new Error(
    '[Jahera] EXPO_PUBLIC_APPWRITE_DATABASE_ID must be set. Add it to .env and restart Metro/dev client.'
  );
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
