import { Client, Account, Databases, Storage, ID, Query } from 'react-native-appwrite';

const appwriteEndpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const appwriteProjectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

export const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'com.jahera.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'jahera_db';

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
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
} as const;

export { ID, Query };
