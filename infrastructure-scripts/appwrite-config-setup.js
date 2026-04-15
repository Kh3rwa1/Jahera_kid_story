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

async function ensureDocument(key, value, label) {
  try {
    // Check if document with this key already exists
    const existing = await databases.listDocuments(DB_ID, COLL_ID, [
      sdk.Query.equal('key', key),
      sdk.Query.limit(1)
    ]);

    if (existing.documents.length > 0) {
      console.log(`ℹ️  [${label}] already exists (key: "${key}"). Skipping.`);
      return;
    }

    await databases.createDocument(DB_ID, COLL_ID, sdk.ID.unique(), {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    });
    console.log(`✅ [${label}] created (key: "${key}").`);
  } catch (err) {
    if (err.code === 409) console.log(`ℹ️  [${label}] already exists.`);
    else console.error(`❌ Error creating [${label}]:`, err.message);
  }
}

async function ensureDefaultDocuments() {
  const configs = [
    {
      key: 'story_system_prompt',
      label: 'System Prompt',
      value: `You are a world-class award-winning creative children's storyteller. 
You write cinematic, age-appropriate adventures for children aged 4-10. 
CRITICAL TONE REQUIREMENTS:
- If Tone is "funny": The story MUST be genuinely humorous for a child. Use silly dialogue, funny misunderstandings, playful slapstick, and whimsical descriptions. The goal is to make them giggle at every turn.
- If Theme is "adventure": Ensure a strong sense of wonder, discovery, and high-stakes excitement (child-safe).
- Character Integrity: Family and friends are HUMANS. Never make them animals or objects. Give them distinct personalities.

Response format: Strictly JSON. No markdown, no fences.`
    },
    {
      key: 'theme_prompts',
      label: 'Theme Prompts',
      value: {
        adventure: 'an exciting adventure with exploration and discovery',
        fantasy: 'a magical fantasy world with spells, dragons, and wonder',
        magic: 'a magical world with spells and wonder',
        animals: 'a world with friendly animals as companions and helpers (the child and named family/friends remain human main characters)',
        space: 'outer space, stars, and planets',
        ocean: 'the deep ocean and colourful sea creatures',
        forest: 'an enchanted forest full of secrets',
        dinosaurs: 'dinosaurs and prehistoric times',
        superheroes: 'superheroes with special powers',
        heroes: 'brave heroes overcoming challenges',
        nature: 'the beauty of nature, plants, and wildlife',
        science: 'science, invention, and curious discoveries',
      }
    },
    {
      key: 'mood_prompts',
      label: 'Mood Prompts',
      value: {
        funny: 'side-splittingly funny, full of playful slapstick, silly puns, and hilarious situations that will make a child giggle and laugh out loud',
        exciting: 'thrilling, high-energy, and full of cinematic action and suspense',
        calming: 'gentle, peaceful, and soothing — perfect for settling down',
        calm: 'gentle, peaceful, and soothing',
        mysterious: 'intriguing, curious, and full of gentle mystery to solve',
        educational: 'engagingly educational — teaching a fascinating fun fact in a story-driven way',
      }
    },
    {
      key: 'length_configs',
      label: 'Length Configs',
      value: {
        short: { words: '200-280 words', tokens: 1200 },
        medium: { words: '400-550 words', tokens: 2000 },
        long: { words: '700-950 words', tokens: 3200 },
      }
    },
    {
      key: 'behavior_goals',
      label: 'Behavior Goals',
      value: {
        confidence: 'The story must show the child taking small brave steps that build confidence over time. Let the hero struggle briefly, then succeed through persistence and support. Do NOT lecture — teach through adventure events.',
        sharing: 'The story must naturally demonstrate why sharing with others brings happiness. Show the main character learning that giving feels better than keeping. Do NOT lecture — teach through story events.',
        kindness: 'Include moments where kindness changes outcomes and helps others feel safe and valued. Show kindness as strength in action. Do NOT lecture — teach through the journey.',
        discipline: 'Show the hero using focus, routine, and follow-through to complete a meaningful mission. Include distractions and how discipline helps overcome them. Do NOT lecture — teach through events.',
        less_screen: 'Make offline play, discovery, and real-world connection feel exciting and magical. Show the child finding joy away from screens. Do NOT lecture — teach through fun adventures.',
        courage: 'Present a fear or challenge and show courage as acting despite feeling scared. Let bravery grow through action and support. Do NOT lecture — teach through story turning points.',
        honesty: 'Create a situation where truth is difficult but honesty leads to trust and repair. Show gentle consequences and growth. Do NOT lecture — teach through outcomes.',
        empathy: 'Show the hero noticing how others feel and responding with care. Let empathy transform conflict into connection. Do NOT lecture — teach through character moments.',
        gratitude: 'Highlight moments where the hero notices everyday blessings and support. Let gratitude deepen joy and relationships. Do NOT lecture — teach through emotional beats.',
        teamwork: 'Design challenges that require cooperation and shared strengths from multiple characters. Show success through collaboration. Do NOT lecture — teach through mission progress.',
        curiosity: 'Encourage questions, exploration, and discovery that unlock progress in the story. Let curiosity drive wonder and solutions. Do NOT lecture — teach through mysteries.',
        responsibility: 'Give the hero an important responsibility and show growth through owning actions and finishing tasks. Include consequences and recovery. Do NOT lecture — teach through the adventure.'
      }
    }
  ];

  console.log(`\n📋 Seeding ${configs.length} config documents...\n`);

  for (const cfg of configs) {
    await ensureDocument(cfg.key, cfg.value, cfg.label);
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

  await ensureDefaultDocuments();

  console.log('\n✨ Setup Complete!');
  console.log('📌 You can now edit any config in Appwrite Console → Database → jahera_db → config');
  console.log('   Config keys: story_system_prompt, theme_prompts, mood_prompts, length_configs, behavior_goals\n');
}

(async () => {
  await setup();
})();

