const sdk = require('node-appwrite');

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69b5657c000d2c28a436';

// Use environment variable or prompt — we'll read from the function's existing API key
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('ERROR: Set APPWRITE_API_KEY env var first.');
  console.error('Usage: APPWRITE_API_KEY=xxx node test-elevenlabs.js');
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const fnClient = new sdk.Functions(client);

async function main() {
  console.log('=== Testing ElevenLabs TTS Integration ===\n');

  const payload = {
    text: "Once upon a time, in a magical forest far away, there lived a little girl named Jahera who loved to explore. Every morning, she would wake up and listen to the birds singing their beautiful songs.",
    languageCode: "en",
    noStore: true  // Don't save to bucket, just return base64
  };

  console.log('Calling generate-audio function (noStore mode)...');
  console.log('Text:', payload.text.substring(0, 60) + '...');
  console.log('Language:', payload.languageCode);
  console.log('');

  try {
    const execution = await fnClient.createExecution(
      'generate-audio',
      JSON.stringify(payload),
      false,   // async = false (wait for response)
      '/',     // path
      'POST'   // method
    );

    console.log('Status:', execution.status);
    console.log('Duration:', execution.duration + 's');
    console.log('Response code:', execution.responseStatusCode);
    console.log('');

    if (execution.logs) {
      console.log('=== FUNCTION LOGS ===');
      console.log(execution.logs);
    }

    if (execution.errors) {
      console.log('=== FUNCTION ERRORS ===');
      console.log(execution.errors);
    }

    if (execution.responseBody) {
      try {
        const body = JSON.parse(execution.responseBody);
        console.log('=== RESPONSE ===');
        console.log('Success:', body.success);
        console.log('Engine:', body.engine || '(not specified)');
        if (body.base64) {
          console.log('Audio size (base64 chars):', body.base64.length);
          console.log('Approx audio bytes:', Math.round(body.base64.length * 0.75));
        }
        if (body.error) {
          console.log('Error:', body.error);
        }
      } catch (e) {
        console.log('Raw response:', execution.responseBody.substring(0, 500));
      }
    }
  } catch (err) {
    console.error('Execution failed:', err.message);
  }
}

(async () => {
  await main();
})();
