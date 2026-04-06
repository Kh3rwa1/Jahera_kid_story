const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '69b5657c000d2c28a436')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const functions = new sdk.Functions(client);
const DB_ID = 'jahera_db';

async function diagnose() {
    console.log('🔍 Starting Appwrite Diagnostics...\n');

    if (!process.env.APPWRITE_API_KEY) {
        console.error('❌ Error: APPWRITE_API_KEY not found in environment.');
        return;
    }

    // 1. Database Check
    try {
        const db = await databases.get(DB_ID);
        console.log(`✅ Database [${DB_ID}] found: ${db.name}`);
    } catch (err) {
        console.error(`❌ Database [${DB_ID}] NOT found or inaccessible: ${err.message}`);
    }

    // 2. Collections Check
    const collections = ['profiles', 'stories', 'config', 'family_members', 'friends'];
    for (const coll of collections) {
        try {
            await databases.getCollection(DB_ID, coll);
            console.log(`✅ Collection [${coll}] is healthy.`);
        } catch (err) {
            console.error(`⚠️ Collection [${coll}] problem: ${err.message}`);
        }
    }

    // 3. Functions Check
    const funcIds = ['generate-story', 'generate-audio'];
    for (const fid of funcIds) {
        try {
            const func = await functions.get(fid);
            console.log(`\n✅ Function [${fid}] found. Runtime: ${func.runtime}`);
            
            // Check Variables
            const vars = await functions.listVariables(fid);
            const varNames = vars.variables.map(v => v.key);
            console.log(`   Defined Variables: ${varNames.join(', ') || 'None'}`);
            
            const required = fid === 'generate-story' 
                ? ['OPENROUTER_API_KEY', 'APPWRITE_API_KEY'] 
                : ['APPWRITE_API_KEY'];
            
            required.forEach(r => {
                if (!varNames.includes(r)) console.error(`   ❌ MISSING REQUIRED VARIABLE: ${r}`);
            });

        } catch (err) {
            console.error(`❌ Function [${fid}] problem: ${err.message}`);
        }
    }

    console.log('\n✨ Diagnostics Complete.');
}

diagnose();
