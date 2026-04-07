require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error("Please set APPWRITE_PROJECT_ID and APPWRITE_API_KEY as environment variables when running this script.");
  console.error("You can generate an API Key deeply into your Appwrite Dashboard -> Settings -> API Keys (Grant full database/files permissions).");
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
  console.log('Initiating Appwrite scaffold...');
  
  // 1. Create Database
  try {
    await databases.create(DB_ID, 'Jahera Database');
    console.log('Database created');
  } catch (err) {
    if (err.code !== 409) console.error(err);
    else console.log('Database Already Exists (Skipping...)');
  }

  // Helpers
  async function createCollection(id, name) {
    try {
      await databases.createCollection(DB_ID, id, name, [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users())
      ]);
      console.log(`Collection [${id}] created`);
    } catch (err) {
      if (err.code !== 409) console.error(`Error creating collection ${id}:`, err.message);
    }
  }

  async function addString(collectionId, key, size, required, isArray = false) {
    try {
      await databases.createStringAttribute(DB_ID, collectionId, key, size, required, undefined, isArray);
    } catch (err) {
      console.error(`   Error adding String ${key} in ${collectionId}: [${err.code}] ${err.message}`);
    }
  }

  async function addInteger(collectionId, key, required, isArray = false) {
    try {
      await databases.createIntegerAttribute(DB_ID, collectionId, key, required, undefined, undefined, undefined, isArray);
    } catch (err) {
      console.error(`   Error adding Integer ${key} in ${collectionId}: [${err.code}] ${err.message}`);
    }
  }

  async function addBoolean(collectionId, key, required, isArray = false) {
    try {
      // signature: databaseId, collectionId, key, required, default, array
      await databases.createBooleanAttribute(DB_ID, collectionId, key, required, undefined, isArray);
    } catch (err) {
      if (err.code !== 409) console.error(`   Error adding Boolean ${key} in ${collectionId}:`, err.message);
    }
  }

  // Let's create all Appwrite Collections according to your typescript definitions
  await createCollection('profiles', 'Profiles');
  console.log('  Adding Attributes to Profiles...');
  await addString('profiles', 'user_id', 255, true);
  await addString('profiles', 'kid_name', 255, true);
  await addString('profiles', 'primary_language', 255, true);
  await addInteger('profiles', 'age', false);
  await addString('profiles', 'parent_pin', 255, false);
  await addString('profiles', 'share_token', 255, false);
  await addString('profiles', 'avatar_url', 1500, false);
  await addString('profiles', 'created_at', 255, false);
  await addString('profiles', 'updated_at', 255, false);

  await createCollection('user_languages', 'User Languages');
  await addString('user_languages', 'profile_id', 255, true);
  await addString('user_languages', 'language_code', 255, true);
  await addString('user_languages', 'language_name', 255, true);
  await addString('user_languages', 'created_at', 255, false);

  await createCollection('family_members', 'Family Members');
  await addString('family_members', 'profile_id', 255, true);
  await addString('family_members', 'name', 255, true);
  await addString('family_members', 'created_at', 255, false);

  await createCollection('friends', 'Friends');
  await addString('friends', 'profile_id', 255, true);
  await addString('friends', 'name', 255, true);
  await addString('friends', 'created_at', 255, false);

  await createCollection('profile_interests', 'Profile Interests');
  await addString('profile_interests', 'profile_id', 255, true);
  await addString('profile_interests', 'interest', 255, true);
  await addString('profile_interests', 'created_at', 255, false);

  await createCollection('stories', 'Stories');
  await addString('stories', 'profile_id', 255, true);
  await addString('stories', 'language_code', 255, true);
  await addString('stories', 'title', 500, true);
  await addString('stories', 'content', 1000000, true); // Extremely high bound for AI Stories limit
  await addString('stories', 'audio_url', 1000, false);
  await addString('stories', 'season', 255, false);
  await addString('stories', 'theme', 255, false);
  await addString('stories', 'mood', 255, false);
  await addInteger('stories', 'word_count', false);
  await addString('stories', 'share_token', 255, false);
  await addInteger('stories', 'like_count', false);
  await addString('stories', 'time_of_day', 255, false);
  await addString('stories', 'generated_at', 255, false);
  await addString('stories', 'created_at', 255, false);
  await addString('stories', 'location_city', 255, false);
  await addString('stories', 'location_country', 255, false);

  await createCollection('quiz_questions', 'Quiz Questions');
  await addString('quiz_questions', 'story_id', 255, true);
  await addString('quiz_questions', 'question_text', 1000, true);
  await addInteger('quiz_questions', 'question_order', true);
  await addString('quiz_questions', 'created_at', 255, false);

  await createCollection('quiz_answers', 'Quiz Answers');
  await addString('quiz_answers', 'question_id', 255, true);
  await addString('quiz_answers', 'answer_text', 1000, true);
  await addBoolean('quiz_answers', 'is_correct', true);
  await addString('quiz_answers', 'answer_order', 255, true);
  await addString('quiz_answers', 'created_at', 255, false);

  await createCollection('quiz_attempts', 'Quiz Attempts');
  await addString('quiz_attempts', 'profile_id', 255, true);
  await addString('quiz_attempts', 'story_id', 255, true);
  await addInteger('quiz_attempts', 'score', true);
  await addInteger('quiz_attempts', 'total_questions', true);
  await addString('quiz_attempts', 'completed_at', 255, false);
  await addString('quiz_attempts', 'created_at', 255, false);

  await createCollection('subscriptions', 'Subscriptions');
  await addString('subscriptions', 'profile_id', 255, true);
  await addString('subscriptions', 'plan', 255, true);
  await addInteger('subscriptions', 'stories_used_this_month', true);
  await addInteger('subscriptions', 'stories_limit', true);
  await addString('subscriptions', 'billing_period_start', 255, false);
  await addString('subscriptions', 'billing_period_end', 255, false);
  await addBoolean('subscriptions', 'is_active', true);
  await addString('subscriptions', 'trial_ends_at', 255, false);
  await addString('subscriptions', 'created_at', 255, false);
  await addString('subscriptions', 'updated_at', 255, false);

  await createCollection('streaks', 'Streaks');
  await addString('streaks', 'profile_id', 255, true);
  await addInteger('streaks', 'current_streak', true);
  await addInteger('streaks', 'longest_streak', true);
  await addString('streaks', 'last_activity_date', 255, false);
  await addInteger('streaks', 'total_days_active', true);
  await addString('streaks', 'created_at', 255, false);
  await addString('streaks', 'updated_at', 255, false);
  
  // Create Storage Buckets
  async function createBucket(id, name) {
    try {
      await storage.createBucket(id, name, [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users()),
        sdk.Permission.delete(sdk.Role.users()),
      ], false, false, undefined, ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'gif']);
      console.log(`Bucket [${id}] created`);
    } catch (err) {
      if (err.code !== 409) console.error(`Error creating bucket ${id}:`, err.message);
    }
  }

  await createBucket('avatars', 'User Avatars (Public)');
  await createBucket('story-audio', 'Story Audio Content');

  console.log('\n\n✅ APPWRITE INFRASTRUCTURE BUILT SUCCESSFULLY ✅');
  console.log('NOTE: Attribute creation is asynchronous on Appwrite\'s servers, so give the Dashboard about 10-30 seconds to show all columns.');
}

(async () => {
  await init();
})();
