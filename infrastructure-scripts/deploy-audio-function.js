/**
 * Deploy the generate-audio function to Appwrite.
 * Uses the node-appwrite SDK to create a deployment from local code.
 * 
 * Usage:
 *   APPWRITE_API_KEY=your_key node infrastructure-scripts/deploy-audio-function.js
 */
require('dotenv').config();
const sdk = require('node-appwrite');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('❌ APPWRITE_API_KEY is not set.');
  process.exit(1);
}

const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const functions = new sdk.Functions(client);

const FUNCTIONS_TO_DEPLOY = [
  { id: 'generate-audio', path: 'appwrite/functions/generate-audio', entrypoint: 'index.js' },
];

async function createTarGz(functionPath) {
  const absPath = path.resolve(functionPath);
  const tarFile = path.join('/tmp', `${path.basename(functionPath)}.tar.gz`);
  
  const ENV = { ...process.env, PATH: `/usr/local/bin:${process.env.PATH || ''}` };
  
  // First install dependencies
  console.log(`   📦 Installing dependencies in ${functionPath}...`);
  execSync('/usr/local/bin/npm install --production', { cwd: absPath, stdio: 'pipe', env: ENV });
  
  // Create tar.gz
  console.log(`   📦 Creating archive...`);
  execSync(`tar -czf ${tarFile} -C ${absPath} .`, { stdio: 'pipe', env: ENV });
  
  return tarFile;
}

async function run() {
  console.log('🚀 Deploying Appwrite Functions...\n');

  for (const func of FUNCTIONS_TO_DEPLOY) {
    console.log(`── Deploying [${func.id}] ──`);
    
    try {
      // Verify function exists
      const funcInfo = await functions.get(func.id);
      console.log(`   ✅ Function exists. Runtime: ${funcInfo.runtime}`);
      
      // Create tar.gz of the function code
      const tarFile = await createTarGz(func.path);
      console.log(`   ✅ Archive created: ${tarFile}`);
      
      // Deploy using the SDK
      console.log(`   🔄 Creating deployment...`);
      const { InputFile } = require('node-appwrite/file');
      const deployment = await functions.createDeployment(
        func.id,
        InputFile.fromPath(tarFile, `${func.id}.tar.gz`),
        true, // activate immediately
        func.entrypoint,
        'npm install'
      );
      
      console.log(`   ✅ Deployment created: ${deployment.$id}`);
      console.log(`   ⏳ Building... (this may take 30-60 seconds)`);
      
      // Poll deployment status
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const dep = await functions.getDeployment(func.id, deployment.$id);
          console.log(`   📊 Status: ${dep.status} (${(i + 1) * 5}s)`);
          if (dep.status === 'ready') {
            ready = true;
            console.log(`   ✅ DEPLOYED SUCCESSFULLY!`);
            break;
          }
          if (dep.status === 'failed') {
            console.error(`   ❌ Deployment FAILED!`);
            if (dep.buildLogs) console.error(`   Build logs: ${dep.buildLogs}`);
            break;
          }
        } catch (pollErr) {
          console.warn(`   ⚠️ Poll error: ${pollErr.message}`);
        }
      }
      
      if (!ready) {
        console.log('   ⚠️ Deployment is still building. Check Appwrite Console for status.');
      }
      
      // Clean up
      fs.unlinkSync(tarFile);
      
    } catch (err) {
      console.error(`   ❌ Error deploying ${func.id}: ${err.message}`);
      if (err.response) console.error(`   Response: ${JSON.stringify(err.response)}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 Deployment process complete!');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
