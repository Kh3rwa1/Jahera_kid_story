/**
 * Check ElevenLabs account info and credits.
 *
 * Usage: ELEVENLABS_API_KEY=your_key node infrastructure-scripts/check-elevenlabs.js
 */
async function checkElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('ERROR: Set ELEVENLABS_API_KEY env var first.');
    console.error(
      'Usage: ELEVENLABS_API_KEY=xxx node infrastructure-scripts/check-elevenlabs.js',
    );
    process.exit(1);
  }
  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/user/subscription',
      {
        headers: { 'xi-api-key': apiKey },
      },
    );
    const data = await response.json();
    console.log('Subscription Info:', JSON.stringify(data, null, 2));

    const usageResp = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey },
    });
    const userData = await usageResp.json();
    console.log('User Info:', JSON.stringify(userData, null, 2));

    const modelsResp = await fetch('https://api.elevenlabs.io/v1/models', {
      headers: { 'xi-api-key': apiKey },
    });
    const modelsData = await modelsResp.json();
    console.log(
      'Available Models:',
      modelsData.map((m) => m.model_id).join(', '),
    );
    const multiV2 = modelsData.find(
      (m) => m.model_id === 'eleven_multilingual_v2',
    );
    if (multiV2) {
      console.log(
        'Multilingual V2 languages:',
        multiV2.languages.map((l) => l.language_id).join(', '),
      );
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
checkElevenLabs();
