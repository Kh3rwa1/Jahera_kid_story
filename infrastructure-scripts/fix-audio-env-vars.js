/**
 * Fix the generate-audio function: set the APPWRITE_API_KEY environment variable.
 * 
 * Usage:
 *   APPWRITE_API_KEY=your_key node infrastructure-scripts/fix-audio-env-vars.js
 */
require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY is not set.');
  process.exit(1);
}

const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const functions = new sdk.Functions(client);

const FUNCTION_ID = 'generate-audio';

// Variables to set on the generate-audio function
const VARIABLES = {
  APPWRITE_API_KEY: API_KEY,
  APPWRITE_DATABASE_ID: 'jahera_db',
  APPWRITE_AUDIO_BUCKET_ID: 'story-audio',
};

async function run() {
  console.log('🔧 Setting environment variables on generate-audio function...\n');

  // First, list existing variables to avoid duplicates
  let existingVars = {};
  try {
    const vars = await functions.listVariables(FUNCTION_ID);
    vars.variables.forEach(v => { existingVars[v.key] = v.$id; });
    console.log(`   Existing variables: ${Object.keys(existingVars).join(', ') || 'None'}`);
  } catch (err) {
    console.error(`   Error listing variables: ${err.message}`);
  }

  for (const [key, value] of Object.entries(VARIABLES)) {
    try {
      if (existingVars[key]) {
        // Update existing variable
        await functions.updateVariable(FUNCTION_ID, existingVars[key], key, value);
        console.log(`   ✅ Updated: ${key}`);
      } else {
        // Create new variable
        await functions.createVariable(FUNCTION_ID, key, value);
        console.log(`   ✅ Created: ${key}`);
      }
    } catch (err) {
      console.error(`   ❌ Error setting ${key}: ${err.message}`);
    }
  }

  // Also check if generate-story function has its APPWRITE_API_KEY
  console.log('\n🔧 Checking generate-story function...');
  try {
    const storyVars = await functions.listVariables('generate-story');
    const storyVarMap = {};
    storyVars.variables.forEach(v => { storyVarMap[v.key] = v.$id; });
    
    if (!storyVarMap.APPWRITE_API_KEY) {
      console.log('   ⚠️ generate-story also missing APPWRITE_API_KEY, setting it...');
      await functions.createVariable('generate-story', 'APPWRITE_API_KEY', API_KEY);
      console.log('   ✅ Created APPWRITE_API_KEY on generate-story');
    } else {
      console.log('   ✅ generate-story already has APPWRITE_API_KEY');
    }
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }

  console.log('\n✅ Environment variables configured!');
  console.log('\n⚠️ Note: The function needs to be RE-DEPLOYED for changes to take effect.');
  console.log('   Run: npx appwrite-cli functions createDeployment --functionId generate-audio --entrypoint index.js --code appwrite/functions/generate-audio');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
