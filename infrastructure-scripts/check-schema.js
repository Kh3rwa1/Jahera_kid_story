require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const DB_ID = 'jahera_db';

async function check() {
  try {
    const collection = await databases.getCollection(DB_ID, 'profiles');
    console.log('--- PROFILES ATTRIBUTES ---');
    collection.attributes.forEach(attr => {
      console.log(`- ${attr.key} (${attr.type}) [${attr.status}]`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
