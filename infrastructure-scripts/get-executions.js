const sdk = require('node-appwrite');
const client = new sdk.Client()
  .setEndpoint('https://sfo.cloud.appwrite.io/v1')
  .setProject('69b5657c000d2c28a436')
  .setKey('standard_7a97361797afbe57afdd50a90d2a893423480757a913449cfc5d950de86b5fcf064e66a1fc20407f303bc19c98e4a30db5fce45d795d5ed4928241a3df50f44bf867dc884d8601a6f92046b8ad650d9b31a143b136320b443813a64cc8a54fdcef4113772ab360f7742be5d85d785bdd63292b716e220d03a538a9507e724d51');

const functions = new sdk.Functions(client);

async function run() {
  try {
    const res = await functions.listExecutions('generate-audio', [
      sdk.Query.limit(5),
      sdk.Query.orderDesc('$createdAt')
    ]);
    res.executions.forEach(ex => {
      console.log(`-------------`);
      console.log(`ID: ${ex.$id}`);
      console.log(`Status: ${ex.status}`);
      console.log(`StatusCode: ${ex.responseStatusCode}`);
      console.log(`Logs: \n${ex.logs}`);
      console.log(`Errors: \n${ex.errors}`);
      console.log(`Body: \n${ex.responseBody}`);
    });
  } catch (err) {
    console.error(err);
  }
}
(async () => {
  await run();
})();
