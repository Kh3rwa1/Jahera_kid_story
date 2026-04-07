require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error("❌ Error: APPWRITE_API_KEY is not set.");
  console.log("\nTo run this setup, please use:");
  console.log("APPWRITE_API_KEY=your_key node appwrite-config-setup.js\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const DB_ID = 'jahera_db';
const COLL_ID = 'config';

async function ensureCollection() {
  try {
    await databases.createCollection(DB_ID, COLL_ID, 'App Configuration', [
      sdk.Permission.read(sdk.Role.any()),
      sdk.Permission.update(sdk.Role.label('admin')),
      sdk.Permission.delete(sdk.Role.label('admin'))
    ]);
    console.log(`✅ Collection [${COLL_ID}] created.`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`ℹ️ Collection [${COLL_ID}] already exists.`);
      return;
    }
    console.error('❌ Error creating collection:', err.message);
    process.exit(1);
  }
}

async function ensureAttribute(attr) {
  try {
    const existing = await databases.listAttributes(DB_ID, COLL_ID);
    const isExist = existing.attributes.some(a => a.key === attr.key);

    if (isExist) {
      console.log(`ℹ️ Attribute [${attr.key}] already exists.`);
      return;
    }

    if (attr.type === 'string') {
      await databases.createStringAttribute(DB_ID, COLL_ID, attr.key, attr.size, attr.required);
      console.log(`✅ Attribute [${attr.key}] created.`);
    }
  } catch (err) {
    if (err.code === 409) console.log(`ℹ️ Attribute [${attr.key}] already exists (Conflict).`);
    else console.error(`❌ Error adding attribute [${attr.key}]:`, err.message);
  }
}

async function ensureDefaultDocument() {
  const defaultPrompt = `You are a creative children's story writer. You write engaging, age-appropriate stories for children aged 4-10. Always respond with valid JSON only — no markdown, no code fences, no extra text.`;
  try {
    await databases.createDocument(DB_ID, COLL_ID, sdk.ID.unique(), {
      key: 'story_system_prompt',
      value: defaultPrompt
    });
    console.log('✅ Default system prompt document created.');
  } catch (err) {
    if (err.code === 409) console.log('ℹ️ Document already exists.');
    else console.error('❌ Error creating document:', err.message);
  }
}

async function setup() {
  console.log(`🚀 Starting Appwrite Configuration Setup for Project: ${PROJECT_ID}...`);

  await ensureCollection();

  const attributes = [
    { key: 'key', type: 'string', size: 255, required: true },
    { key: 'value', type: 'string', size: 1000000, required: true }
  ];

  for (const attr of attributes) {
    await ensureAttribute(attr);
  }

  console.log('⏳ Waiting 3 seconds for attributes to propagate...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  await ensureDefaultDocument();
  console.log('\n✨ Setup Complete! You can now edit the "story_system_prompt" in your Appwrite Console.');
}

(async () => {
  await setup();
})();
