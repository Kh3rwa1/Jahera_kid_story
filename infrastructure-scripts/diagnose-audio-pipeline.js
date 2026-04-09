/**
 * Full diagnostic for the audio generation pipeline.
 * 
 * Usage:
 *   APPWRITE_API_KEY=your_key node infrastructure-scripts/diagnose-audio-pipeline.js
 */
require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = 'jahera_db';

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY is not set.');
  console.log('\nUsage:\n  APPWRITE_API_KEY=your_key node infrastructure-scripts/diagnose-audio-pipeline.js\n');
  process.exit(1);
}

const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);
const functions = new sdk.Functions(client);

async function run() {
  console.log('='.repeat(60));
  console.log('🔍 AUDIO PIPELINE DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project:  ${PROJECT_ID}\n`);

  // ── 1. Check Database ──
  console.log('── 1. DATABASE CHECK ──');
  try {
    const db = await databases.get(DB_ID);
    console.log(`✅ Database [${DB_ID}] exists: "${db.name}"`);
  } catch (err) {
    console.error(`❌ Database [${DB_ID}] NOT FOUND: ${err.message}`);
    return;
  }

  // ── 2. Check Stories Collection & audio_url attribute ──
  console.log('\n── 2. STORIES COLLECTION CHECK ──');
  try {
    const coll = await databases.getCollection(DB_ID, 'stories');
    console.log(`✅ Collection [stories] exists: "${coll.name}"`);
    
    const attrs = await databases.listAttributes(DB_ID, 'stories');
    const audioAttr = attrs.attributes.find(a => a.key === 'audio_url');
    if (audioAttr) {
      console.log(`✅ Attribute [audio_url] exists. Type: ${audioAttr.type}, Size: ${audioAttr.size}, Status: ${audioAttr.status}`);
    } else {
      console.error('❌ Attribute [audio_url] is MISSING from stories collection!');
    }
  } catch (err) {
    console.error(`❌ Stories collection error: ${err.message}`);
  }

  // ── 3. Check Storage Bucket ──
  console.log('\n── 3. STORAGE BUCKET CHECK ──');
  const bucketIds = ['story-audio', 'story_audio', 'storyAudio'];
  let foundBucket = null;
  
  for (const bid of bucketIds) {
    try {
      const bucket = await storage.getBucket(bid);
      console.log(`✅ Bucket [${bid}] exists: "${bucket.name}"`);
      console.log(`   Enabled: ${bucket.enabled}`);
      console.log(`   Max File Size: ${bucket.maximumFileSize} bytes`);
      console.log(`   Allowed Extensions: ${JSON.stringify(bucket.allowedFileExtensions)}`);
      console.log(`   Permissions: ${JSON.stringify(bucket.$permissions)}`);
      foundBucket = bid;
      break;
    } catch (err) {
      if (err.code === 404) {
        console.log(`   ⚠️ Bucket [${bid}] does not exist.`);
      } else {
        console.error(`   ❌ Error checking bucket [${bid}]: ${err.message}`);
      }
    }
  }

  if (!foundBucket) {
    console.error('\n❌ NO AUDIO BUCKET FOUND! Listing all buckets:');
    try {
      const allBuckets = await storage.listBuckets();
      if (allBuckets.buckets.length === 0) {
        console.error('   No buckets exist at all!');
      } else {
        allBuckets.buckets.forEach(b => {
          console.log(`   - [${b.$id}] "${b.name}" (enabled: ${b.enabled})`);
        });
      }
    } catch (err) {
      console.error(`   Error listing buckets: ${err.message}`);
    }
  }

  // ── 4. Check generate-audio Function ──
  console.log('\n── 4. GENERATE-AUDIO FUNCTION CHECK ──');
  try {
    const func = await functions.get('generate-audio');
    console.log(`✅ Function [generate-audio] exists.`);
    console.log(`   Runtime: ${func.runtime}`);
    console.log(`   Status: ${func.status}`);
    console.log(`   Timeout: ${func.timeout}s`);
    console.log(`   Enabled: ${func.enabled}`);
    console.log(`   Active Deployment: ${func.deployment || 'NONE'}`);

    if (!func.deployment) {
      console.error('   ❌ CRITICAL: No active deployment! The function has never been deployed.');
    }

    // Check environment variables
    console.log('\n   Environment Variables:');
    try {
      const vars = await functions.listVariables('generate-audio');
      if (vars.variables.length === 0) {
        console.error('   ❌ NO VARIABLES SET!');
      }
      
      const varMap = {};
      vars.variables.forEach(v => {
        varMap[v.key] = v.value;
        // Mask sensitive values
        const masked = v.key.includes('KEY') || v.key.includes('SECRET') 
          ? v.value.substring(0, 8) + '...' 
          : v.value;
        console.log(`   ✅ ${v.key} = ${masked}`);
      });

      // Check required variables
      const required = ['APPWRITE_API_KEY'];
      const recommended = ['ELEVENLABS_API_KEY', 'APPWRITE_AUDIO_BUCKET_ID', 'APPWRITE_DATABASE_ID'];
      
      console.log('\n   Required Variables Check:');
      required.forEach(key => {
        if (varMap[key]) {
          console.log(`   ✅ ${key} is SET`);
        } else {
          console.error(`   ❌ ${key} is MISSING — function cannot write to DB or upload files!`);
        }
      });

      console.log('\n   Recommended Variables Check:');
      recommended.forEach(key => {
        if (varMap[key]) {
          console.log(`   ✅ ${key} is SET`);
        } else {
          console.log(`   ⚠️ ${key} is not set (has fallback default)`);
        }
      });

      // Note about auto-injected vars
      console.log('\n   ℹ️ APPWRITE_FUNCTION_ENDPOINT and APPWRITE_FUNCTION_PROJECT_ID');
      console.log('      are auto-injected by Appwrite runtime (not visible here).');

    } catch (err) {
      console.error(`   ❌ Error listing variables: ${err.message}`);
    }

  } catch (err) {
    console.error(`❌ Function [generate-audio] NOT FOUND: ${err.message}`);
    console.error('   The function needs to be deployed first!');
  }

  // ── 5. Check recent executions ──
  console.log('\n── 5. RECENT EXECUTIONS CHECK ──');
  try {
    const execs = await functions.listExecutions('generate-audio', [
      sdk.Query.limit(10),
      sdk.Query.orderDesc('$createdAt')
    ]);
    
    if (execs.executions.length === 0) {
      console.error('   ❌ NO EXECUTIONS FOUND — function has never been triggered!');
    } else {
      console.log(`   Found ${execs.total} total executions. Showing last ${execs.executions.length}:\n`);
      execs.executions.forEach((ex, i) => {
        console.log(`   [${i + 1}] ID: ${ex.$id}`);
        console.log(`       Created: ${ex.$createdAt}`);
        console.log(`       Status:  ${ex.status}`);
        console.log(`       Duration: ${ex.duration}s`);
        if (ex.responseStatusCode) console.log(`       HTTP Status: ${ex.responseStatusCode}`);
        if (ex.errors) console.log(`       ❌ Errors: ${ex.errors.substring(0, 300)}`);
        if (ex.logs) console.log(`       📋 Logs: ${ex.logs.substring(0, 300)}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error(`   ❌ Error listing executions: ${err.message}`);
  }

  // ── 6. Check for stories missing audio_url ──
  console.log('── 6. STORIES WITHOUT AUDIO ──');
  try {
    const stories = await databases.listDocuments(DB_ID, 'stories', [
      sdk.Query.isNull('audio_url'),
      sdk.Query.limit(5),
      sdk.Query.orderDesc('$createdAt')
    ]);
    console.log(`   Stories missing audio_url: ${stories.total}`);
    stories.documents.forEach(s => {
      console.log(`   - [${s.$id}] "${s.title}" (created: ${s.$createdAt})`);
    });
  } catch (err) {
    console.error(`   Error querying stories: ${err.message}`);
  }

  // ── 7. Check files in audio bucket ──
  if (foundBucket) {
    console.log('\n── 7. AUDIO FILES IN BUCKET ──');
    try {
      const files = await storage.listFiles(foundBucket, [
        sdk.Query.limit(5),
        sdk.Query.orderDesc('$createdAt')
      ]);
      console.log(`   Total files in bucket: ${files.total}`);
      files.files.forEach(f => {
        console.log(`   - [${f.$id}] ${f.name} (${f.sizeOriginal} bytes, created: ${f.$createdAt})`);
      });
    } catch (err) {
      console.error(`   Error listing files: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
