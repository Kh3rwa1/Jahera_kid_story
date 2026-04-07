const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69b5657c000d2c28a436')
    .setKey(process.env.API_KEY || '69ce19024f2b988f50da'); // I'll use the key I found earlier or user's.

const functions = new sdk.Functions(client);

async function getLogs() {
    try {
        const result = await functions.listExecutions(
            'generate-story',
            [sdk.Query.orderDesc('$createdAt'), sdk.Query.limit(5)]
        );
        
        console.log('Latest Executions:');
        result.executions.forEach(ex => {
            console.log(`- ID: ${ex.$id}, Status: ${ex.status}, Status Code: ${ex.responseStatusCode}, Duration: ${ex.duration}s`);
            console.log(`  CreatedAt: ${ex.$createdAt}`);
            console.log(`  Errors: ${ex.errors || 'None'}`);
            console.log(`  Logs: ${ex.logs || 'None'}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Error fetching logs:', err.message);
    }
}

(async () => {
  await getLogs();
})();
