const sdk = require('node-appwrite');
const { EdgeTTS } = require('@andresaya/edge-tts');

const DATABASE_ID = 'jahera_db';
const STORIES_COLLECTION = 'stories';

// Polyfill crypto for Node.js runtimes that don't have it globally
if (typeof crypto === 'undefined') {
  const nodeCrypto = require('crypto');
  if (nodeCrypto.webcrypto) {
    global.crypto = nodeCrypto.webcrypto;
  }
}

// High-quality Microsoft Edge neural voices per language
const LANGUAGE_VOICE_MAP = {
  en: 'en-US-AnaNeural',         // Child-friendly female voice
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  de: 'de-DE-KatjaNeural',
  it: 'it-IT-ElsaNeural',
  pt: 'pt-BR-FranciscaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  ar: 'ar-SA-ZariyahNeural',
  hi: 'hi-IN-SwaraNeural',
  tr: 'tr-TR-EmelNeural',
  pl: 'pl-PL-ZofiaNeural',
  nl: 'nl-NL-ColetteNeural',
  sv: 'sv-SE-SofieNeural',
  no: 'nb-NO-PernilleNeural',
  da: 'da-DK-ChristelNeural',
  fi: 'fi-FI-NooraNeural',
  el: 'el-GR-AthinaNeural',
  bn: 'bn-IN-TanishaaNeural',
  ta: 'ta-IN-PallaviNeural',
  te: 'te-IN-ShrutiNeural',
  mr: 'mr-IN-AarohiNeural',
  gu: 'gu-IN-DhwaniNeural',
  kn: 'kn-IN-SapnaNeural',
  ml: 'ml-IN-SobhanaNeural',
  pa: 'pa-IN-GurjoNeural',
  ur: 'ur-PK-UzmaNeural',
  th: 'th-TH-PremwadeeNeural',
  vi: 'vi-VN-HoaiMyNeural',
  id: 'id-ID-GadisNeural',
  ms: 'ms-MY-YasminNeural',
  uk: 'uk-UA-PolinaNeural',
  cs: 'cs-CZ-VlastaNeural',
  ro: 'ro-RO-AlinaNeural',
  hu: 'hu-HU-NoemiNeural',
  he: 'he-IL-HilaNeural',
  bg: 'bg-BG-KalinaNeural',
  sk: 'sk-SK-ViktoriaNeural',
  hr: 'hr-HR-GabrijelaNeural',
  sr: 'sr-RS-SophieNeural',
  lt: 'lt-LT-OnaNeural',
  lv: 'lv-LV-EveritaNeural',
  et: 'et-EE-AnuNeural',
  sw: 'sw-KE-ZuriNeural',
  af: 'af-ZA-AdriNeural',
  fil: 'fil-PH-BlessicaNeural',
  ne: 'ne-NP-HemkalaNeural',
  si: 'si-LK-ThiliniNeural',
  ka: 'ka-GE-EkaNeural',
  az: 'az-AZ-BanuNeural',
  mk: 'mk-MK-MarijaNeural',
  bs: 'bs-BA-VesnaNeural',
  mt: 'mt-MT-GraceNeural',
  gl: 'gl-ES-SabelaNeural',
  cy: 'cy-GB-NiaNeural',
  is: 'is-IS-GudrunNeural',
  lo: 'lo-LA-KeomanyNeural',
  km: 'km-KH-SreychomNeural',
  am: 'am-ET-MekdesNeural',
  so: 'so-SO-UbaxNeural',
  zu: 'zu-ZA-ThandoNeural',
  mn: 'mn-MN-YesuiNeural',
  ps: 'ps-AF-LatifaNeural',
  my: 'my-MM-NilarNeural',
  jv: 'jv-ID-SitiNeural',
  su: 'su-ID-TutiNeural',
};

const DEFAULT_VOICE = 'en-US-AnaNeural';

// Truncate text to avoid TTS timeouts (Edge TTS handles up to ~5000 chars well)
function prepareText(text, maxChars = 4500) {
  if (text.length <= maxChars) return text;
  // Truncate at last sentence boundary
  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclaim = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclaim, lastQuestion);
  return lastSentenceEnd > maxChars * 0.5
    ? truncated.slice(0, lastSentenceEnd + 1)
    : truncated;
}

module.exports = async ({ req, res, log, error }) => {
  try {
    let body;
    try {
      if (req.body) {
        log('Request body type: ' + typeof req.body);
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else {
        error('No request body found');
        return res.json({ success: false, error: 'No request body' }, 400);
      }
    } catch (err) {
      error('Failed to parse request body: ' + err.message);
      return res.json({ success: false, error: 'Invalid JSON' }, 400);
    }

    const { text, languageCode, storyId, noStore } = body;
    const lang = languageCode || 'en';

    if (!text) {
      error('No text provided for audio generation');
      return res.json({ success: false, error: 'Missing text' }, 400);
    }

    // Appwrite configuration from Environment Variables
    const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const bucketId = process.env.APPWRITE_AUDIO_BUCKET_ID || 'story-audio';

    if (!apiKey) {
      error('No Appwrite API key available for storage/database operations.');
      return res.json({ success: false, error: 'Server authentication missing' }, 500);
    }

    // Initialize Appwrite SDK
    const client = new sdk.Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const storage = new sdk.Storage(client);
    const databases = new sdk.Databases(client);

    // Hash text and lang for a deterministic file ID (caching)
    const nodeCrypto = require('crypto');
    const fileId = nodeCrypto.createHash('md5').update(`${text}_${lang}`).digest('hex');
    const fileName = `${fileId}.mp3`;

    log(`Processing audio request. ID: ${storyId || 'preview'}, hash: ${fileId}, lang: ${lang}`);

    // Check if the audio already exists (Smart Cache)
    if (!noStore) {
      try {
        log('Checking for existing file in bucket...');
        await storage.getFile(bucketId, fileId);
        const audioUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
        log(`Cache HIT! Returning existing audio: ${audioUrl}`);

        // Ensure DB is updated on cache hit too
        if (storyId) {
          try {
            await databases.updateDocument(DATABASE_ID, STORIES_COLLECTION, storyId, { audio_url: audioUrl });
            log(`Story ${storyId} synced with existing audio_url (cache hit).`);
          } catch (dbErr) {
            error(`DB sync failed (non-fatal): ${dbErr.message}`);
          }
        }

        return res.json({ success: true, audio_url: audioUrl, cached: true });
      } catch (err) {
        log('Cache MISS. Generating new audio...');
      }
    } else {
      log('noStore mode: skipping cache check.');
    }

    // Pick the best voice for the language
    const voice = LANGUAGE_VOICE_MAP[lang] || DEFAULT_VOICE;
    log(`Using voice: ${voice} for ${lang}`);

    // Generate audio using Microsoft Edge TTS
    const tts = new EdgeTTS();
    const preparedTextContent = prepareText(text);
    
    log('Synthesizing speech via Edge TTS...');
    await tts.synthesize(preparedTextContent.replace(/[*_#]/g, ''), voice);
    const audioBuffer = tts.toBuffer();

    if (!audioBuffer || audioBuffer.length < 500) {
      error('Edge TTS returned suspicious or empty buffer.');
      return res.json({ success: false, error: 'TTS generation failed' }, 500);
    }

    log(`Audio generated: ${audioBuffer.length} bytes.`);

    if (noStore) {
      const base64 = audioBuffer.toString('base64');
      log('Ephemeral mode: returning base64 source.');
      return res.json({ success: true, base64, format: 'mp3' });
    }

    // Upload to Appwrite Storage
    log('Uploading file to bucket...');
    const { InputFile } = require('node-appwrite/file');
    const inputFile = InputFile.fromBuffer(audioBuffer, fileName);

    await storage.createFile(bucketId, fileId, inputFile);
    const audioUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    log(`Upload successful: ${audioUrl}`);

    // Write to Database
    if (storyId) {
      try {
        log(`Updating story ${storyId} in database...`);
        await databases.updateDocument(DATABASE_ID, STORIES_COLLECTION, storyId, { audio_url: audioUrl });
        log('Document updated successfully.');
      } catch (dbErr) {
        error(`DB update failed: ${dbErr.message}`);
        // We still return the audioUrl because the file was uploaded
      }
    }

    return res.json({ success: true, audio_url: audioUrl, cached: false });

  } catch (err) {
    error('CRITICAL: Audio generation failure: ' + err.message);
    if (err.stack) error(err.stack);
    return res.json({ success: false, error: err.message }, 500);
  }
};
