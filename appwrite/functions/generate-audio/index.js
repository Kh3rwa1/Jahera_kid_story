const sdk = require('node-appwrite');
const https = require('https');

const LANGUAGE_VOICE_MAP = {
  en: 'pNInz6obpgDQGcFmaJgB',
  es: 'VR6AewLTigWG4xSOukaG',
  fr: 'TxGEqnHWrfWFTfGW9XjX',
  de: 'nPczCjzI2devNBz1zQrb',
  it: 'XB0fDUnXU5powFXDhCwa',
  pt: 'yoZ06aMxZJJ28mfd3POQ',
  ru: 'bIHbv24MWmeRgasZH58o',
  zh: 'Xb7hH8MSUJpSbSDYk0k2',
  ja: 'jsCqWAovK2LkecY7zXl4',
  ko: 'bVMeCyTHy58xNoL34h3p',
  ar: 'pqHfZKP75CvOlQylNhV4',
  hi: 'ZQe5CZNOzWyzPSCn5a3c',
  tr: 'flq6f7yk4E4fJM5XTYuZ',
  pl: 'ThT5KcBeYPX3keUQqHPh',
  nl: 'D38z5RcWu1voky8WS1ja',
  sv: 'N2lVS1w4EtoT3dr4eOWO',
  no: 'SOYHLrjzK2X1ezoPC6cr',
  da: 'EXAVITQu4vr4xnSDxMaL',
  fi: 'JBFqnCBsd6RMkjVDRZzb',
  el: 'iP95p4xoKVk53GoZ742B',
};

const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

async function fetchBuffer(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

module.exports = async ({ req, res, log, error }) => {
  try {
    let body = {};
    if (req.body) {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch {
        body = {};
      }
    }

    const { text, languageCode, storyId } = body;

    if (!text || !storyId) {
      return res.json({ error: 'Missing required fields: text, storyId', audioUrl: null }, 400);
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey || elevenLabsApiKey.length < 20) {
      return res.json({ error: 'ElevenLabs API key not configured on server', audioUrl: null });
    }

    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const storage = new sdk.Storage(client);

    const voiceId = LANGUAGE_VOICE_MAP[languageCode || 'en'] || DEFAULT_VOICE_ID;
    const elevenLabsPath = `/v1/text-to-speech/${voiceId}`;

    const requestBody = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    });

    const { status: elevenStatus, buffer: audioBuffer } = await fetchBuffer(
      'https://api.elevenlabs.io' + elevenLabsPath,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
          'Content-Length': Buffer.byteLength(requestBody),
        },
        body: requestBody,
      }
    );

    if (elevenStatus !== 200) {
      return res.json({
        error: `ElevenLabs error: ${elevenStatus}`,
        detail: audioBuffer.toString('utf8').slice(0, 200),
        audioUrl: null,
      });
    }

    const bucketId = process.env.APPWRITE_AUDIO_BUCKET_ID || 'story-audio';
    const fileId = sdk.ID.unique();
    const fileName = `${storyId}.mp3`;

    const { InputFile } = sdk;
    const inputFile = InputFile.fromBuffer(audioBuffer, fileName);

    await storage.createFile(bucketId, fileId, inputFile);

    const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const audioUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;

    return res.json({ audioUrl });
  } catch (err) {
    error('generate-audio error: ' + err.message);
    return res.json({ error: err.message || 'Unknown error', audioUrl: null });
  }
};
