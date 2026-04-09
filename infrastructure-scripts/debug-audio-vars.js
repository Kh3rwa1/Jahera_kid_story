/**
 * Debug: Check and fix the function variables with more detail.
 * Delete and re-create variables if they're empty.
 */
require('dotenv').config();
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) { console.error('❌ APPWRITE_API_KEY required.'); process.exit(1); }

const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const functions = new sdk.Functions(client);

const FUNC_ID = 'generate-audio';

async function run() {
  console.log('🔍 Checking generate-audio function in detail...\n');

  // Check function info
  const func = await functions.get(FUNC_ID);
  console.log('Function object keys:', Object.keys(func).join(', '));
  console.log('Deployment field:', JSON.stringify(func.deployment));
  console.log('deploymentId field:', JSON.stringify(func.deploymentId));
  console.log('Enabled:', func.enabled);

  // List deployments
  console.log('\n── All Deployments ──');
  try {
    const deployments = await functions.listDeployments(FUNC_ID, [
      sdk.Query.orderDesc('$createdAt'),
      sdk.Query.limit(5)
    ]);
    console.log(`Total deployments: ${deployments.total}`);
    deployments.deployments.forEach(d => {
      console.log(`  - [${d.$id}] Status: ${d.status}, Created: ${d.$createdAt}, Activate: ${d.activate}`);
    });
  } catch (err) {
    console.error('Error listing deployments:', err.message);
  }

  // Check variables in detail
  console.log('\n── Variables Detail ──');
  const vars = await functions.listVariables(FUNC_ID);
  console.log(`Total variables: ${vars.total}`);
  
  for (const v of vars.variables) {
    console.log(`  ID: ${v.$id}`);
    console.log(`  Key: ${v.key}`);
    console.log(`  Value type: ${typeof v.value}`);
    console.log(`  Value length: ${v.value ? v.value.length : 0}`);
    console.log(`  Value (first 20): "${(v.value || '').substring(0, 20)}..."`);
    console.log('');
  }

  // If variables are empty, delete and re-create them
  const apiKeyVar = vars.variables.find(v => v.key === 'APPWRITE_API_KEY');
  if (apiKeyVar && (!apiKeyVar.value || apiKeyVar.value.length === 0)) {
    console.log('⚠️ APPWRITE_API_KEY variable exists but is EMPTY. Deleting and re-creating...');
    
    // Delete all existing variables
    for (const v of vars.variables) {
      try {
        await functions.deleteVariable(FUNC_ID, v.$id);
        console.log(`  ✅ Deleted: ${v.key}`);
      } catch (err) {
        console.error(`  ❌ Error deleting ${v.key}: ${err.message}`);
      }
    }

    // Re-create with explicit values
    const newVars = [
      { key: 'APPWRITE_API_KEY', value: API_KEY },
      { key: 'APPWRITE_DATABASE_ID', value: 'jahera_db' },
      { key: 'APPWRITE_AUDIO_BUCKET_ID', value: 'story-audio' },
    ];

    for (const nv of newVars) {
      try {
        const result = await functions.createVariable(FUNC_ID, nv.key, nv.value);
        console.log(`  ✅ Created ${nv.key} (value length: ${nv.value.length})`);
      } catch (err) {
        console.error(`  ❌ Error creating ${nv.key}: ${err.message}`);
      }
    }

    console.log('\n  Verifying...');
    const newVarsList = await functions.listVariables(FUNC_ID);
    newVarsList.variables.forEach(v => {
      console.log(`  ${v.key}: value length=${v.value ? v.value.length : 0}, first 20="${(v.value || '').substring(0, 20)}"`);
    });
  } else if (apiKeyVar) {
    console.log(`✅ APPWRITE_API_KEY appears to have a value (length: ${apiKeyVar.value?.length})`);
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
