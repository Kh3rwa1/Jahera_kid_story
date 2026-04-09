const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const nodeCrypto = require('node:crypto');

// Polyfill globalThis.crypto for Node 18 (required by @andresaya/edge-tts)
if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
}

const { EdgeTTS } = require('@andresaya/edge-tts');

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jahera_db';
const STORIES_COLLECTION = 'stories';
const CACHE_VERSION = 'v1_final'; // Tracking for story-audio cache hits

// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs Configuration
// ─────────────────────────────────────────────────────────────────────────────

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Warm, expressive storytelling voices (multilingual v2 model handles ALL languages)
const ELEVENLABS_VOICES = {
  default: 'EXAVITQu4vr4xnSDxMaL',  // Sarah — warm, calm, storytelling
  storytelling: 'EXAVITQu4vr4xnSDxMaL',
  childFriendly: 'FGY2WhTYpPnrIDTdsKH5', // Laura — gentle, soothing
  energetic: 'TX3LPaxmHKxFdv7VOQHJ',     // Liam — upbeat, fun
};

// ElevenLabs model: multilingual v2 handles 29+ languages with ONE voice
const ELEVENLABS_MODEL = 'eleven_multilingual_v2';

// Supported languages for Multilingual V2 on common tiers
const ELEVENLABS_SUPPORTED_LANGS = [
  'en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'
];

// ─────────────────────────────────────────────────────────────────────────────
// Edge TTS Fallback — High-quality Microsoft Edge neural voices per language
// ─────────────────────────────────────────────────────────────────────────────

// Female Edge TTS voices — warm, storytelling
const EDGE_VOICE_MAP_FEMALE = {
  en: 'en-US-JennyNeural',   // warm, maternal
  hi: 'hi-IN-SwaraNeural',
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
};

// Male Edge TTS voices — energetic, adventurous
const EDGE_VOICE_MAP_MALE = {
  en: 'en-US-GuyNeural',     // clear male narration
  hi: 'hi-IN-MadhurNeural',
  es: 'es-ES-AlvaroNeural',
  fr: 'fr-FR-HenriNeural',
  de: 'de-DE-ConradNeural',
  it: 'it-IT-DiegoNeural',
  pt: 'pt-BR-AntonioNeural',
  ru: 'ru-RU-DmitryNeural',
  zh: 'zh-CN-YunxiNeural',
  ja: 'ja-JP-KeitaNeural',
  ko: 'ko-KR-InJoonNeural',
  ar: 'ar-SA-HamedNeural',
};

// Default neutral female map (all languages)
const EDGE_VOICE_MAP = {
  en: 'en-US-AnaNeural',
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

const DEFAULT_EDGE_VOICE = 'en-US-AnaNeural';

// ─────────────────────────────────────────────────────────────────────────────
// Text preparation
// ─────────────────────────────────────────────────────────────────────────────

function prepareText(text, maxChars = 4500) {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclaim = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclaim, lastQuestion);
  return lastSentenceEnd > maxChars * 0.5
    ? truncated.slice(0, lastSentenceEnd + 1)
    : truncated;
}

// Strip markdown formatting for cleaner speech
function cleanTextForSpeech(text) {
  return text.replaceAll(/[*_#`~\[\]]/g, '').replace(/\n{2,}/g, '. ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs TTS — Primary (human-quality)
// ─────────────────────────────────────────────────────────────────────────────

async function generateWithElevenLabs(text, lang, apiKey, options, log) {
  const { voiceId, modelId, stability, similarity, style, speakerBoost } = options;
  const voice = voiceId || ELEVENLABS_VOICES.default;
  const model = modelId || ELEVENLABS_MODEL;

  log(`[ElevenLabs] Generating with voice ${voice}, model ${model}, lang ${lang}`);

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text,
      model_id: model,
      voice_settings: {
        stability: stability ?? 0.65,
        similarity_boost: similarity ?? 0.8,
        style: style ?? 0.35,
        use_speaker_boost: speakerBoost ?? true,
      },
      // Language hint for multilingual model
      language_code: lang,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 500) {
    throw new Error('ElevenLabs returned suspiciously small audio buffer');
  }

  log(`[ElevenLabs] Success: ${buffer.length} bytes generated`);
  return buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge TTS — Fallback (free, decent quality)
// ─────────────────────────────────────────────────────────────────────────────

async function generateWithEdgeTTS(text, lang, log, gender) {
  // Pick gender-appropriate voice map when a voice preset is selected
  let voiceMap = EDGE_VOICE_MAP;
  if (gender === 'male') voiceMap = EDGE_VOICE_MAP_MALE;
  else if (gender === 'female') voiceMap = EDGE_VOICE_MAP_FEMALE;

  const voice = voiceMap[lang] || EDGE_VOICE_MAP[lang] || DEFAULT_EDGE_VOICE;
  log(`[EdgeTTS] Fallback: generating with voice ${voice}, lang ${lang}, gender ${gender || 'neutral'}`);

  const tts = new EdgeTTS();
  await tts.synthesize(text, voice);
  const buffer = tts.toBuffer();

  if (!buffer || buffer.length < 500) {
    throw new Error('Edge TTS returned empty or suspiciously small buffer');
  }

  log(`[EdgeTTS] Success: ${buffer.length} bytes generated`);
  return buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Function Handler
// ─────────────────────────────────────────────────────────────────────────────

async function generateAudioHandler({ req, res, log, error }) {
  try {
    // ── Parse request ──
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

    const { text, languageCode, storyId, noStore, voiceId, modelId, stability, similarity, style, speakerBoost, gender } = body;
    const lang = languageCode || 'en';

    if (!text) {
      error('No text provided for audio generation');
      return res.json({ success: false, error: 'Missing text' }, 400);
    }

    // ── Appwrite setup ──
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const bucketId = process.env.APPWRITE_AUDIO_BUCKET_ID || 'story-audio';

    if (!apiKey) {
      error('❌ CRITICAL: APPWRITE_API_KEY environment variable is missing.');
      return res.json({ success: false, error: 'Server authentication missing' }, 500);
    }

    log(`[Config] Using Endpoint: ${endpoint}, Project: ${projectId}`);
    log(`[Config] Using Bucket: ${bucketId}`);

    const client = new sdk.Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const storage = new sdk.Storage(client);
    const databases = new sdk.Databases(client);

    // Ensure DATABASE_ID is locked to what the environment says
    const activeDB = DATABASE_ID;
    log(`[Config] Active Database ID: ${activeDB}`);

    // ── Compute deterministic file ID for caching ──
    // Add a cache version to force regeneration for stories created before ElevenLabs
    // Add all audio parameters to hash to ensure settings changes trigger regeneration
    const settingsHash = `${voiceId || ''}-${modelId || ''}-${stability || ''}-${similarity || ''}-${style || ''}-${speakerBoost || ''}`;
    const fileId = nodeCrypto.createHash('md5').update(`${text}_${lang}_${CACHE_VERSION}_${settingsHash}`).digest('hex');
    const fileName = `${fileId}.mp3`;

    log(`Processing audio request. ID: ${storyId || 'preview'}, hash: ${fileId}, lang: ${lang}`);

    // ── Check cache ──
    if (!noStore) {
      try {
        log('Checking for existing file in bucket...');
        await storage.getFile(bucketId, fileId);
        const audioUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
        log(`Cache HIT! Returning existing audio: ${audioUrl}`);

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

    // ── Prepare text for speech ──
    const preparedText = cleanTextForSpeech(prepareText(text));

    // ── Generate audio: ElevenLabs (primary) → Edge TTS (fallback) ──
    let audioBuffer;
    let engine = 'unknown';

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoice = process.env.ELEVENLABS_VOICE_ID;

    if (elevenLabsKey) {
      if (!ELEVENLABS_SUPPORTED_LANGS.includes(lang)) {
        log(`[ElevenLabs] Language '${lang}' is not supported by ${ELEVENLABS_MODEL}. Skipping to Edge TTS.`);
      } else {
        try {
          audioBuffer = await generateWithElevenLabs(preparedText, lang, elevenLabsKey, {
            voiceId: voiceId || elevenLabsVoice,
            modelId,
            stability,
            similarity,
            style,
            speakerBoost
          }, log);
          engine = 'elevenlabs';
        } catch (elevenErr) {
          error(`[ElevenLabs] Failed: ${elevenErr.message}. Falling back to Edge TTS...`);
          // Fall through to Edge TTS
        }
      }
    } else {
      log('[ElevenLabs] No API key configured. Using Edge TTS directly.');
    }

    // Fallback: Edge TTS
    if (!audioBuffer) {
      try {
        audioBuffer = await generateWithEdgeTTS(preparedText, lang, log, gender);
        engine = 'edge-tts';
      } catch (edgeErr) {
        error(`[EdgeTTS] Also failed: ${edgeErr.message}`);
        return res.json({ success: false, error: 'All TTS engines failed' }, 500);
      }
    }

    log(`Audio generated via ${engine}: ${audioBuffer.length} bytes.`);

    // ── Ephemeral mode (no storage) ──
    if (noStore) {
      const base64 = audioBuffer.toString('base64');
      log(`Ephemeral mode (${engine}): returning base64 source.`);
      return res.json({ success: true, base64, format: 'mp3', engine });
    }

    // ── Upload to Appwrite Storage ──
    log('Uploading file to bucket...');
    const { InputFile } = require('node-appwrite/file');
    const inputFile = InputFile.fromBuffer(audioBuffer, fileName);

    await storage.createFile(bucketId, fileId, inputFile);
    const audioUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    log(`Upload successful (${engine}): ${audioUrl}`);

    // ── Write audio_url to Database ──
    if (storyId) {
      try {
        log(`Updating story ${storyId} in database [${activeDB}]...`);
        await databases.updateDocument(activeDB, STORIES_COLLECTION, storyId, { audio_url: audioUrl });
        log('Document updated successfully.');
      } catch (dbErr) {
        error(`DB update failed: ${dbErr.message}`);
      }
    }

    // ── Prepare Response ──
    const responseData = { 
      success: true, 
      audio_url: audioUrl, 
      cached: false, 
      engine 
    };

    // If noStore is true, also return the raw audio as base64 for instant preview
    if (noStore) {
      responseData.base64 = audioBuffer.toString('base64');
    }

    return res.json(responseData);

  } catch (err) {
    error('CRITICAL: Audio generation failure: ' + err.message);
    if (err.stack) error(err.stack);
    return res.json({ success: false, error: err.message }, 500);
  }
};

module.exports = generateAudioHandler;
