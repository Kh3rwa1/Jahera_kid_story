/**
 * Activate the latest deployment and run an end-to-end test.
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
  // Step 1: Get latest ready deployment
  console.log('── Step 1: Find and activate latest deployment ──');
  const deployments = await functions.listDeployments('generate-audio', [
    sdk.Query.orderDesc('$createdAt'),
    sdk.Query.limit(5)
  ]);
  
  const latestReady = deployments.deployments.find(d => d.status === 'ready');
  if (!latestReady) {
    console.error('❌ No ready deployment found!');
    return;
  }
  
  console.log(`Latest ready deployment: ${latestReady.$id} (created: ${latestReady.$createdAt})`);
  
  // Activate it using updateDeployment
  try {
    await functions.updateDeployment('generate-audio', latestReady.$id);
    console.log('✅ Deployment activated!');
  } catch (err) {
    console.error(`Error activating: ${err.message}`);
    // Try alternative method
    console.log('Trying update function...');
    try {
      await functions.update('generate-audio', 'generate-audio', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, latestReady.$id);
      console.log('✅ Deployment activated via function update!');
    } catch (err2) {
      console.error(`Also failed: ${err2.message}`);
    }
  }

  // Verify
  const func = await functions.get('generate-audio');
  console.log(`Current deploymentId: ${func.deploymentId}`);
  console.log(`Live: ${func.live}`);

  // Step 2: Wait a moment for propagation
  console.log('\n── Step 2: Waiting 3 seconds... ──');
  await new Promise(r => setTimeout(r, 3000));

  // Step 3: Test execution
  console.log('\n── Step 3: Testing execution ──');
  try {
    const execution = await functions.createExecution(
      'generate-audio',
      JSON.stringify({
        text: 'Once upon a time, there was a little girl named Jahera who loved to explore.',
        languageCode: 'en',
        noStore: true
      }),
      false,
      '/',
      sdk.ExecutionMethod.POST
    );

    console.log(`Execution ID: ${execution.$id}`);
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
            console.log(`Audio size: ~${Math.round(body.base64.length * 0.75 / 1024)} KB`);
          }
        } else {
          console.error(`❌ Function error: ${body.error}`);
        }
      } catch (e) {
        console.log(`Raw response: ${execution.responseBody.substring(0, 300)}`);
      }
    }
  } catch (err) {
    console.error(`❌ Execution failed: ${err.message}`);
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
