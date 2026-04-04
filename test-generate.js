const sdk = require('node-appwrite');
const client = new sdk.Client()
  .setEndpoint('https://sfo.cloud.appwrite.io/v1')
  .setProject('69b5657c000d2c28a436')
  .setKey('standard_7a97361797afbe57afdd50a90d2a893423480757a913449cfc5d950de86b5fcf064e66a1fc20407f303bc19c98e4a30db5fce45d795d5ed4928241a3df50f44bf867dc884d8601a6f92046b8ad650d9b31a143b136320b443813a64cc8a54fdcef4113772ab360f7742be5d85d785bdd63292b716e220d03a538a9507e724d51');

const functions = new sdk.Functions(client);

async function run() {
  try {
    console.log("Triggering FRESH audio generation...");
    const req = await functions.createExecution('generate-audio', JSON.stringify({
      text: "This is a brand new verification test to ensure the Edge TTS engine is synthesizing audio correctly after our recent deployment. " + Date.now(),
      languageCode: "en",
      noStore: true
    }));

    let executionId = req.$id;
    console.log(`Execution started: ${executionId}`);

    let execution = req;
    while(execution.status === 'processing' || execution.status === 'waiting') {
      await new Promise(r => setTimeout(r, 2000));
      execution = await functions.getExecution('generate-audio', executionId);
    }

    console.log(`Status: ${execution.status}`);
    console.log(`Logs: \n${execution.logs}`);
    console.log(`Errors: \n${execution.errors}`);
    console.log(`Body: \n${execution.responseBody}`);
  } catch (err) {
    console.error(err);
  }
}
run();
