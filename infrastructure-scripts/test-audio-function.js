/**
 * Quick verification: test the generate-audio function with a short text.
 */
require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) { console.error('❌ APPWRITE_API_KEY required.'); process.exit(1); }

const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const functions = new sdk.Functions(client);

async function run() {
  console.log('🧪 Testing generate-audio function...\n');

  // 1. Check deployment status
  try {
    const func = await functions.get('generate-audio');
    console.log(`Function deployment ID: ${func.deployment}`);
    console.log(`Function enabled: ${func.enabled}`);
    
    if (func.deployment) {
      const dep = await functions.getDeployment('generate-audio', func.deployment);
      console.log(`Deployment status: ${dep.status}`);
      console.log(`Deployment created: ${dep.$createdAt}`);
    }
  } catch (err) {
    console.error(`Error checking function: ${err.message}`);
  }

  // 2. List variables (just keys, no values)
  try {
    const vars = await functions.listVariables('generate-audio');
    console.log(`\nVariables (${vars.variables.length}):`);
    vars.variables.forEach(v => {
      console.log(`  - ${v.key} (${v.value ? 'SET' : 'EMPTY'})`);
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // 3. Execute a test (noStore mode, very short text)
  console.log('\n🔄 Executing test (noStore mode with Edge TTS)...');
  try {
    const execution = await functions.createExecution(
      'generate-audio',
      JSON.stringify({
        text: 'Hello! This is a test of the audio generation system.',
        languageCode: 'en',
        noStore: true
      }),
      false, // sync execution
      '/',   // path
      sdk.ExecutionMethod.POST
    );

    console.log(`\nExecution ID: ${execution.$id}`);
    console.log(`Status: ${execution.status}`);
    console.log(`Duration: ${execution.duration}s`);
    console.log(`HTTP Status: ${execution.responseStatusCode}`);
    
    if (execution.errors) {
      console.error(`❌ Errors: ${execution.errors}`);
    }
    
    if (execution.logs) {
      console.log(`📋 Logs:\n${execution.logs}`);
    }

    if (execution.responseBody) {
      try {
        const body = JSON.parse(execution.responseBody);
        if (body.success) {
          console.log(`\n✅ SUCCESS! Engine: ${body.engine}`);
          if (body.base64) {
            console.log(`   Audio size: ${body.base64.length} chars (base64)`);
          }
        } else {
          console.error(`❌ Function returned failure: ${body.error}`);
        }
      } catch (e) {
        console.log(`Raw response (first 200 chars): ${execution.responseBody.substring(0, 200)}`);
      }
    }
  } catch (err) {
    console.error(`❌ Execution failed: ${err.message}`);
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
