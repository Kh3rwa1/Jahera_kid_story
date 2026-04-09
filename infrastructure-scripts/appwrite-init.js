require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error("Please set APPWRITE_PROJECT_ID and APPWRITE_API_KEY as environment variables.");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);
const DB_ID = 'jahera_db';

async function init() {
  console.log('🚀 Initiating Appwrite scaffold...');
  
  try {
    await databases.create(DB_ID, 'Jahera Database');
    console.log('✅ Database created');
  } catch (err) {
    if (err.code !== 409) console.error('❌ Database error:', err.message);
    else console.log('ℹ️ Database Already Exists');
  }

  const createCollection = async (id, name) => {
    try {
      await databases.createCollection(DB_ID, id, name, [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users())
      ]);
      console.log(`📦 Collection [${id}] created`);
    } catch (err) {
      if (err.code !== 409) console.error(`❌ Error creating collection ${id}:`, err.message);
    }
  };

  const addAttr = async (type, collectionId, key, options = {}) => {
    try {
      const { size = 255, required = false, isArray = false, defaultVal = undefined } = options;
      switch (type) {
        case 'string':
          await databases.createStringAttribute(DB_ID, collectionId, key, size, required, defaultVal, isArray);
          break;
        case 'integer':
          await databases.createIntegerAttribute(DB_ID, collectionId, key, required, undefined, undefined, defaultVal, isArray);
          break;
        case 'boolean':
          await databases.createBooleanAttribute(DB_ID, collectionId, key, required, defaultVal, isArray);
          break;
      }
    } catch (err) {
      if (err.code !== 409) console.error(`   ⚠️ Attr ${key} in ${collectionId}: [${err.code}] ${err.message}`);
    }
  };

  // Parallelize Collection Creation
  const collections = [
    { id: 'profiles', name: 'Profiles' },
    { id: 'user_languages', name: 'User Languages' },
    { id: 'family_members', name: 'Family Members' },
    { id: 'friends', name: 'Friends' },
    { id: 'profile_interests', name: 'Profile Interests' },
    { id: 'stories', name: 'Stories' },
    { id: 'quiz_questions', name: 'Quiz Questions' },
    { id: 'quiz_answers', name: 'Quiz Answers' },
    { id: 'quiz_attempts', name: 'Quiz Attempts' },
    { id: 'subscriptions', name: 'Subscriptions' },
    { id: 'streaks', name: 'Streaks' },
    { id: 'config', name: 'App Configuration' },
    { id: 'api_keys', name: 'API Keys' }
  ];

  await Promise.all(collections.map(c => createCollection(c.id, c.name)));

  // Parallelize Attribute Creation (Per Collection)
  const attributeTasks = [
    // Profiles
    addAttr('string', 'profiles', 'user_id', { required: true }),
    addAttr('string', 'profiles', 'kid_name', { required: true }),
    addAttr('string', 'profiles', 'primary_language', { required: true }),
    addAttr('integer', 'profiles', 'age'),
    addAttr('string', 'profiles', 'parent_pin'),
    addAttr('string', 'profiles', 'share_token'),
    addAttr('string', 'profiles', 'avatar_url', { size: 1500 }),
    addAttr('string', 'profiles', 'city'),
    addAttr('string', 'profiles', 'region'),
    addAttr('string', 'profiles', 'country'),
    addAttr('string', 'profiles', 'consent_given_at'),
    addAttr('string', 'profiles', 'elevenlabs_voice_id'),
    addAttr('string', 'profiles', 'elevenlabs_model_id'),
    addAttr('integer', 'profiles', 'elevenlabs_stability'),
    addAttr('integer', 'profiles', 'elevenlabs_similarity'),
    addAttr('integer', 'profiles', 'elevenlabs_style'),
    addAttr('boolean', 'profiles', 'elevenlabs_speaker_boost'),
    addAttr('string', 'profiles', 'created_at'),
    addAttr('string', 'profiles', 'updated_at'),

    // User Languages
    addAttr('string', 'user_languages', 'profile_id', { required: true }),
    addAttr('string', 'user_languages', 'language_code', { required: true }),
    addAttr('string', 'user_languages', 'language_name', { required: true }),
    addAttr('string', 'user_languages', 'created_at'),

    // Family Members
    addAttr('string', 'family_members', 'profile_id', { required: true }),
    addAttr('string', 'family_members', 'name', { required: true }),
    addAttr('string', 'family_members', 'created_at'),

    // Friends
    addAttr('string', 'friends', 'profile_id', { required: true }),
    addAttr('string', 'friends', 'name', { required: true }),
    addAttr('string', 'friends', 'created_at'),

    // Profile Interests
    addAttr('string', 'profile_interests', 'profile_id', { required: true }),
    addAttr('string', 'profile_interests', 'interest', { required: true }),
    addAttr('string', 'profile_interests', 'created_at'),

    // Stories
    addAttr('string', 'stories', 'profile_id', { required: true }),
    addAttr('string', 'stories', 'language_code', { required: true }),
    addAttr('string', 'stories', 'title', { size: 500, required: true }),
    addAttr('string', 'stories', 'content', { size: 1000000, required: true }),
    addAttr('string', 'stories', 'audio_url', { size: 1000 }),
    addAttr('string', 'stories', 'season'),
    addAttr('string', 'stories', 'theme'),
    addAttr('string', 'stories', 'mood'),
    addAttr('integer', 'stories', 'word_count'),
    addAttr('string', 'stories', 'share_token'),
    addAttr('integer', 'stories', 'like_count'),
    addAttr('string', 'stories', 'time_of_day'),
    addAttr('string', 'stories', 'generated_at'),
    addAttr('string', 'stories', 'created_at'),
    addAttr('string', 'stories', 'location_city'),
    addAttr('string', 'stories', 'location_country'),
    addAttr('string', 'stories', 'behavior_goal'),

    // Quiz Questions
    addAttr('string', 'quiz_questions', 'story_id', { required: true }),
    addAttr('string', 'quiz_questions', 'question_text', { size: 1000, required: true }),
    addAttr('integer', 'quiz_questions', 'question_order', { required: true }),
    addAttr('string', 'quiz_questions', 'created_at'),

    // Quiz Answers
    addAttr('string', 'quiz_answers', 'question_id', { required: true }),
    addAttr('string', 'quiz_answers', 'answer_text', { size: 1000, required: true }),
    addAttr('boolean', 'quiz_answers', 'is_correct', { required: true }),
    addAttr('string', 'quiz_answers', 'answer_order', { required: true }),
    addAttr('string', 'quiz_answers', 'created_at'),

    // Quiz Attempts
    addAttr('string', 'quiz_attempts', 'profile_id', { required: true }),
    addAttr('string', 'quiz_attempts', 'story_id', { required: true }),
    addAttr('integer', 'quiz_attempts', 'score', { required: true }),
    addAttr('integer', 'quiz_attempts', 'total_questions', { required: true }),
    addAttr('string', 'quiz_attempts', 'completed_at'),
    addAttr('string', 'quiz_attempts', 'created_at'),

    // Subscriptions
    addAttr('string', 'subscriptions', 'profile_id', { required: true }),
    addAttr('string', 'subscriptions', 'plan', { required: true }),
    addAttr('integer', 'subscriptions', 'stories_used_this_month', { required: true }),
    addAttr('integer', 'subscriptions', 'stories_limit', { required: true }),
    addAttr('string', 'subscriptions', 'billing_period_start'),
    addAttr('string', 'subscriptions', 'billing_period_end'),
    addAttr('boolean', 'subscriptions', 'is_active', { required: true }),
    addAttr('string', 'subscriptions', 'trial_ends_at'),
    addAttr('string', 'subscriptions', 'created_at'),
    addAttr('string', 'subscriptions', 'updated_at'),

    // Streaks
    addAttr('string', 'streaks', 'profile_id', { required: true }),
    addAttr('integer', 'streaks', 'current_streak', { required: true }),
    addAttr('integer', 'streaks', 'longest_streak', { required: true }),
    addAttr('string', 'streaks', 'last_activity_date'),
    addAttr('integer', 'streaks', 'total_days_active', { required: true }),
    addAttr('string', 'streaks', 'created_at'),
    addAttr('string', 'streaks', 'updated_at'),

    // Config
    addAttr('string', 'config', 'key', { required: true }),
    addAttr('string', 'config', 'value', { size: 10000, required: true }),
    addAttr('string', 'config', 'created_at'),

    // API Keys
    addAttr('string', 'api_keys', 'user_id', { required: true }),
    addAttr('string', 'api_keys', 'service', { required: true }),
    addAttr('string', 'api_keys', 'encrypted_key', { size: 2000, required: true }),
    addAttr('string', 'api_keys', 'created_at'),
    addAttr('string', 'api_keys', 'updated_at')
  ];

  console.log('⚡ Adding attributes in parallel...');
  await Promise.all(attributeTasks);

  // Buckets
  const createBucket = async (id, name) => {
    try {
      await storage.createBucket(id, name, [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
      ], false, false, undefined, ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'gif', 'mp4', 'webm', 'json']);
      console.log(`🪣 Bucket [${id}] created`);
    } catch (err) {
      if (err.code !== 409) console.error(`❌ Error creating bucket ${id}:`, err.message);
    }
  };

  await Promise.all([
    createBucket('avatars', 'User Avatars (Public)'),
    createBucket('story-audio', 'Story Audio Content'),
    createBucket('app_assets', 'App Assets (Video & Images)'),
    createBucket('behavior_assets', 'Nature & Habits Assets (Lottie JSON)')
  ]);

  console.log('\n✅ INFRASTRUCTURE READY');
}

init();
