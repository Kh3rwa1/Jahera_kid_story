import { Client, Account, Databases, Storage, Functions, ID, Query } from 'react-native-appwrite';
import { Platform } from 'react-native';

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';

const clientBuilder = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

if (Platform.OS !== 'web') {
  clientBuilder.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'com.hindi.harp');
}

export const client = clientBuilder;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'jahera_db';
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
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
} as const;

export { ID, Query };
