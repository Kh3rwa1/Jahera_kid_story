/**
 * ============================================================
 * Jahera — Bulk Template Story Seeder
 * ============================================================
 * 
 * Generates 100+ bedtime story templates using Google Gemini
 * via OpenRouter, then uploads them to Appwrite.
 * 
 * Run ONCE from your local machine (not inside the app):
 * 
 *   npx tsx scripts/seedTemplates.ts
 * 
 * Required env vars (create a .env.seed file or export them):
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY        ← Server API key from Appwrite Console
 *   APPWRITE_DATABASE_ID
 *   OPENROUTER_API_KEY
 * ============================================================
 */

import 'dotenv/config';

// Use dynamic import for node-appwrite since it's ESM/CJS depending on version
const { Client, Databases, ID } = require('node-appwrite');

// ─── Config ──────────────────────────────────────────────────
const ENDPOINT      = process.env.APPWRITE_ENDPOINT     || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID    = process.env.APPWRITE_PROJECT_ID   || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY       = process.env.APPWRITE_API_KEY;       // SERVER key, not client
const DATABASE_ID   = process.env.APPWRITE_DATABASE_ID  || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY   || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const COLLECTION_ID = 'story_templates';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID || !OPENROUTER_KEY) {
  console.error('\n❌ Missing env vars. Required:');
  console.error('   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY,');
  console.error('   APPWRITE_DATABASE_ID, OPENROUTER_API_KEY\n');
  process.exit(1);
}

// ─── Appwrite Client ─────────────────────────────────────────
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// ─── Story Combinations ─────────────────────────────────────
const BEHAVIOR_GOALS = [
  'confidence', 'sharing', 'kindness', 'discipline', 'less_screen',
  'calmness', 'courage', 'honesty', 'empathy', 'gratitude',
  'teamwork', 'curiosity', 'responsibility',
];

const THEMES = [
  'magical forest', 'underwater kingdom', 'space adventure',
  'tiny village', 'mountain quest', 'enchanted garden',
  'cloud city', 'dinosaur island', 'robot workshop',
  'pirate treasure', 'dream carnival', 'rainbow bridge',
];

const MOODS = ['exciting', 'cozy', 'mysterious', 'funny', 'heartwarming'];

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

// ─── Gemini Call ─────────────────────────────────────────────
async function generateStory(
  behaviorGoal: string,
  theme: string,
  mood: string,
  language: { code: string; label: string }
): Promise<{ title: string; content: string } | null> {

  const prompt = `You are a world-class children's storyteller.

Write a ${mood} bedtime story in ${language.label} for children aged 3-8.

ABSOLUTE RULES:
- The main character MUST be named {CHILD_NAME} — keep this EXACT placeholder everywhere, never replace it
- Include a friend called {FRIEND_NAME} — keep this EXACT placeholder
- Include a family member called {FAMILY_MEMBER} — keep this EXACT placeholder
- The story is set in or near {CITY} — keep this EXACT placeholder
- Theme: ${theme}
- The story must naturally teach the value of: ${behaviorGoal.replace(/_/g, ' ')}
- Length: 500-700 words
- Age-appropriate, zero violence, zero scary content, no death
- End with a warm and hopeful conclusion
- Do NOT lecture or moralize — weave the lesson into adventure and emotions

CRITICAL: output exactly this JSON and nothing else:
{
  "title": "a short story title that includes {CHILD_NAME}",
  "content": "the full story text with all four placeholders used naturally throughout"
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jahera.app',
        'X-Title': 'Jahera Template Seeder',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content || '';

    // Extract JSON — handle markdown code fences if present
    const jsonStr = raw.includes('{') ? raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw;
    const parsed = JSON.parse(jsonStr);

    if (!parsed.title || !parsed.content) {
      throw new Error('Missing title or content in response');
    }

    return parsed;
  } catch (err: any) {
    console.error(`   ⚠️  Gemini error: ${err.message}`);
    return null;
  }
}

// ─── Validation ──────────────────────────────────────────────
function validatePlaceholders(story: { title: string; content: string }): boolean {
  const required = ['{CHILD_NAME}'];
  // Title must have CHILD_NAME, content must have all four
  const contentRequired = ['{CHILD_NAME}', '{FRIEND_NAME}', '{FAMILY_MEMBER}', '{CITY}'];

  const titleOk = required.every(p => story.title.includes(p));
  const contentOk = contentRequired.every(p => story.content.includes(p));

  if (!titleOk) console.warn('   ⚠️  Title missing {CHILD_NAME}');
  if (!contentOk) {
    const missing = contentRequired.filter(p => !story.content.includes(p));
    console.warn(`   ⚠️  Content missing: ${missing.join(', ')}`);
  }

  // At minimum, CHILD_NAME must be in the content
  return story.content.includes('{CHILD_NAME}');
}

// ─── Upload to Appwrite ──────────────────────────────────────
async function uploadTemplate(
  story: { title: string; content: string },
  goal: string,
  theme: string,
  mood: string,
  langCode: string
): Promise<boolean> {
  try {
    const placeholders = ['{CHILD_NAME}', '{FRIEND_NAME}', '{FAMILY_MEMBER}', '{CITY}']
      .filter(p => story.content.includes(p))
      .map(p => p.replace(/[{}]/g, ''));

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      title_template: story.title,
      content_template: story.content,
      behavior_goal: goal,
      theme,
      mood,
      language_code: langCode,
      placeholder_fields: JSON.stringify(placeholders),
      word_count: story.content.split(/\s+/).filter(Boolean).length,
    });
    return true;
  } catch (err: any) {
    console.error(`   ❌ Appwrite upload error: ${err.message}`);
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 Jahera Template Seeder');
  console.log('========================\n');
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Project:     ${PROJECT_ID}`);
  console.log(`Database:    ${DATABASE_ID}`);
  console.log(`Collection:  ${COLLECTION_ID}`);
  console.log(`Languages:   ${LANGUAGES.map(l => l.code).join(', ')}`);
  console.log(`Goals:       ${BEHAVIOR_GOALS.length}`);
  console.log(`Themes:      ${THEMES.length}`);
  console.log('');

  // Check collection exists
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log('✅ Collection "story_templates" found\n');
  } catch {
    console.error('❌ Collection "story_templates" not found in your database.');
    console.error('   Create it first with the attributes listed in the setup guide.\n');
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalUploaded = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const language of LANGUAGES) {
    console.log(`\n📖 Language: ${language.label} (${language.code})`);
    console.log('─'.repeat(50));

    for (const goal of BEHAVIOR_GOALS) {
      // Pick 4 random themes per goal per language
      const shuffledThemes = [...THEMES].sort(() => Math.random() - 0.5).slice(0, 4);

      for (let i = 0; i < shuffledThemes.length; i++) {
        const theme = shuffledThemes[i];
        const mood = MOODS[i % MOODS.length];
        const storyNum = totalGenerated + 1;

        process.stdout.write(`   [${storyNum}] ${goal} / ${theme} / ${mood} ... `);

        const story = await generateStory(goal, theme, mood, language);

        if (!story) {
          console.log('FAILED (generation)');
          totalFailed++;
          await delay(2000);
          continue;
        }

        if (!validatePlaceholders(story)) {
          console.log('SKIPPED (placeholders missing)');
          totalSkipped++;
          await delay(1000);
          continue;
        }

        const uploaded = await uploadTemplate(story, goal, theme, mood, language.code);

        if (uploaded) {
          totalUploaded++;
          console.log('✅');
        } else {
          totalFailed++;
          console.log('FAILED (upload)');
        }

        totalGenerated++;

        // Rate limit: pause between API calls
        await delay(1500);
      }
    }
  }

  console.log('\n\n========== SEED COMPLETE ==========');
  console.log(`   Generated:  ${totalGenerated}`);
  console.log(`   Uploaded:   ${totalUploaded}`);
  console.log(`   Skipped:    ${totalSkipped} (placeholder issues)`);
  console.log(`   Failed:     ${totalFailed}`);
  console.log('====================================\n');

  if (totalUploaded === 0) {
    console.log('⚠️  No templates were uploaded. Check your API keys and collection schema.\n');
  } else {
    console.log(`🎉 ${totalUploaded} templates are now live in Appwrite.`);
    console.log('   Free users will see personalized stories immediately.\n');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

seed().catch((err) => {
  console.error('\n💥 Seeder crashed:', err);
  process.exit(1);
});
