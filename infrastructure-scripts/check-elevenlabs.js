/**
 * Check ElevenLabs account info and credits.
 */
async function checkElevenLabs() {
  const apiKey = 'da3c08044ca2732bfaf11026d95a3ba7fbaecbe96b1d298190418ad1a1c94daa';
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey }
    });
    const data = await response.json();
    console.log('Subscription Info:', JSON.stringify(data, null, 2));
    
    const usageResp = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': apiKey }
    });
    const userData = await usageResp.json();
    console.log('User Info:', JSON.stringify(userData, null, 2));

    const modelsResp = await fetch('https://api.elevenlabs.io/v1/models', {
        headers: { 'xi-api-key': apiKey }
    });
    const modelsData = await modelsResp.json();
    console.log('Available Models:', modelsData.map(m => m.model_id).join(', '));
    const multiV2 = modelsData.find(m => m.model_id === 'eleven_multilingual_v2');
    if (multiV2) {
        console.log('Multilingual V2 languages:', multiV2.languages.map(l => l.language_id).join(', '));
    }

  } catch (err) {
    console.error('Error:', err);
  }
}
checkElevenLabs();
