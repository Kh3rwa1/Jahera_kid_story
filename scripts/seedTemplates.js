#!/usr/bin/env node
/**
 * Seed reusable free-tier story templates into Appwrite.
 *
 * Required env:
 *   APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID=...
 *   APPWRITE_API_KEY=...
 *   APPWRITE_DATABASE_ID=jahera_db
 */

require('dotenv').config();

const { Client, Databases, ID } = require('node-appwrite');

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'jahera_db';
const collectionId = 'story_templates';

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const templates = [
  {
    title_template: '{CHILD_NAME} and the Kindness Kite',
    content_template: '{CHILD_NAME} woke up in {CITY} to find a bright kite tangled near the balcony. With {FRIEND_NAME}, {CHILD_NAME} chose to help a younger child fix the torn tail before flying it. By bedtime, everyone remembered that kindness grows when we share our time.',
    behavior_goal: 'kindness',
    theme: 'adventure',
    mood: 'warm',
    language_code: 'en',
  },
  {
    title_template: '{CHILD_NAME} Finds the Brave Little Lantern',
    content_template: 'One evening in {CITY}, {CHILD_NAME} and {FAMILY_MEMBER} found a tiny lantern glowing beside the path. The light became brighter each time {CHILD_NAME} tried something scary but safe: asking a question, helping {FRIEND_NAME}, and taking one brave step at a time.',
    behavior_goal: 'courage',
    theme: 'magical',
    mood: 'calm',
    language_code: 'en',
  },
  {
    title_template: 'The Sharing Train of {CITY}',
    content_template: '{CHILD_NAME} and {FRIEND_NAME} built a toy train from pillows, books, and blankets. At first, {CHILD_NAME} wanted every carriage, but the train only moved when everyone had a turn. By the final station, sharing made the whole journey more fun.',
    behavior_goal: 'sharing',
    theme: 'adventure',
    mood: 'playful',
    language_code: 'en',
  },
  {
    title_template: '{CHILD_NAME} and the Calm Moon',
    content_template: 'When the evening felt noisy, {CHILD_NAME} looked up at the moon above {CITY}. {FAMILY_MEMBER} taught three slow breaths: smell the flower, cool the soup, rest the heart. Soon {CHILD_NAME} felt calm enough to solve the problem gently.',
    behavior_goal: 'calmness',
    theme: 'bedtime',
    mood: 'calm',
    language_code: 'en',
  },
];

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function seed() {
  for (const template of templates) {
    await databases.createDocument(databaseId, collectionId, ID.unique(), {
      ...template,
      placeholder_fields: JSON.stringify(['CHILD_NAME', 'FRIEND_NAME', 'FAMILY_MEMBER', 'CITY']),
      word_count: wordCount(template.content_template),
    });
    console.log(`Seeded: ${template.title_template}`);
  }
}

seed().catch((error) => {
  console.error('Failed to seed story templates:', error);
  process.exit(1);
});
