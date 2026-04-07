const sdk = require('node-appwrite');
const client = new sdk.Client()
  .setEndpoint('https://sfo.cloud.appwrite.io/v1')
  .setProject('69b5657c000d2c28a436')
  .setKey('standard_7a97361797afbe57afdd50a90d2a893423480757a913449cfc5d950de86b5fcf064e66a1fc20407f303bc19c98e4a30db5fce45d795d5ed4928241a3df50f44bf867dc884d8601a6f92046b8ad650d9b31a143b136320b443813a64cc8a54fdcef4113772ab360f7742be5d85d785bdd63292b716e220d03a538a9507e724d51');

const functions = new sdk.Functions(client);

async function testStory() {
  try {
    console.log('Spooling up Claude 3.5 Sonnet through AgentRouter in Appwrite...');
    const payload = JSON.stringify({
      profile: { kid_name: "Aaditya" },
      languageCode: "bn",
      context: { season: "Spring", timeOfDay: "Morning" },
      options: { theme: "adventure", mood: "exciting", length: "short" }
    });

    const req = await functions.createExecution({
      functionId: 'generate-story', 
      body: payload,
      async: true
    });
    
    let executionId = req.$id;
    console.log(`Execution started: ${executionId}`);

    let execution = req;
    while(execution.status === 'processing' || execution.status === 'waiting') {
      await new Promise(r => setTimeout(r, 2000));
      execution = await functions.getExecution('generate-story', executionId);
      process.stdout.write('.');
    }
    console.log('\n');
    console.log(`Status: ${execution.status}`);
    
    if (execution.status === 'failed') {
      console.log(`Errors: \n${execution.errors}`);
      console.log(`Logs: \n${execution.logs}`);
      return;
    }

    const responseData = JSON.parse(execution.responseBody);
    console.log('--- GENERATED STORY JSON ---');
    console.log(JSON.stringify(responseData, null, 2));
    
  } catch (err) {
    console.error(err);
  }
}

(async () => {
  await testStory();
})();
