const sdk = require('node-appwrite'); 
const client = new sdk.Client().setEndpoint('https://sfo.cloud.appwrite.io/v1').setProject(process.env.PROJECT_ID).setKey(process.env.API_KEY);
const databases = new sdk.Databases(client);
databases.list().then(res => {
  console.log('Databases found:', res.total);
  res.databases.forEach(d => console.log('DB:', d.name, d.$id));
}).catch(err => {
  console.error('Error:', err.message);
});
