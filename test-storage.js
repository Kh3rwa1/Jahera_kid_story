const sdk = require('node-appwrite'); 
const client = new sdk.Client().setEndpoint('https://sfo.cloud.appwrite.io/v1').setProject(process.env.PROJECT_ID).setKey(process.env.API_KEY);
const storage = new sdk.Storage(client);
(async () => {
  try {
    const res = await storage.listBuckets();
    console.log('Buckets found:', res.total);
    res.buckets.forEach(b => console.log('Bucket:', b.name, b.$id));
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
