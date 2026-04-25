const https = require('node:https');
const url = require('node:url');
const { Client, Databases, Query } = require('node-appwrite');

/**
 * Robust HTTPS POST helper with timeout
 */
function httpsPost(baseUrl, path, headers, body, timeoutMs = 25000) {
  const bodyStr = JSON.stringify(body);
  const providerUrl = new URL(baseUrl);

  const requestPromise = new Promise((resolve, reject) => {
    const options = {
      hostname: providerUrl.hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error('Provider request timed out')),
      timeoutMs,
    );
  });

  return Promise.race([requestPromise, timeoutPromise]);
}

const DEFAULT_THEME_PROMPTS = {
  adventure: 'an exciting adventure with exploration and discovery',
  fantasy: 'a magical fantasy world with spells, dragons, and wonder',
  magic: 'a magical world with spells and wonder',
  animals:
    'a world with friendly animals as companions and helpers (the child and named family/friends remain human main characters)',
  space: 'outer space, stars, and planets',
  ocean: 'the deep ocean and colourful sea creatures',
  forest: 'an enchanted forest full of secrets',
  dinosaurs: 'dinosaurs and prehistoric times',
  superheroes: 'superheroes with special powers',
  heroes: 'brave heroes overcoming challenges',
  nature: 'the beauty of nature, plants, and wildlife',
  science: 'science, invention, and curious discoveries',
};

const DEFAULT_MOOD_PROMPTS = {
  funny:
    'side-splittingly funny, full of playful slapstick, silly puns, and hilarious situations that will make a child giggle and laugh out loud',
  exciting: 'thrilling, high-energy, and full of cinematic action and suspense',
  calming: 'gentle, peaceful, and soothing — perfect for settling down',
  calm: 'gentle, peaceful, and soothing',
  mysterious: 'intriguing, curious, and full of gentle mystery to solve',
  educational:
    'engagingly educational — teaching a fascinating fun fact in a story-driven way',
};

const DEFAULT_LENGTH_CONFIGS = {
  short: { words: '700-900 words', tokens: 1500 },
  medium: { words: '1400-1600 words', tokens: 3000 },
  long: { words: '2800-3200 words', tokens: 6000 },
};

const OPENROUTER_BASE = 'https://openrouter.ai';
const CLAUDE_BASE = 'https://api.anthropic.com';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const GEMINI_MODEL = 'gemini-2.0-flash';

function sanitizeForPrompt(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>{}[\]\/`]/g, '')
    .replace(
      /\b(ignore|instruction|system|prompt|override|forget|disregard)\b/gi,
      '',
    )
    .trim()
    .slice(0, 100);
}

const DEFAULT_BEHAVIOR_GOALS = {
  confidence:
    'The story must show the child taking small brave steps that build confidence over time. Let the hero struggle briefly, then succeed through persistence and support. Do NOT lecture — teach through adventure events.',
  sharing:
    'The story must naturally demonstrate why sharing with others brings happiness. Show the main character learning that giving feels better than keeping. Do NOT lecture — teach through story events.',
  kindness:
    'Include moments where kindness changes outcomes and helps others feel safe and valued. Show kindness as strength in action. Do NOT lecture — teach through the journey.',
  discipline:
    'Show the hero using focus, routine, and follow-through to complete a meaningful mission. Include distractions and how discipline helps overcome them. Do NOT lecture — teach through events.',
  less_screen:
    'Make offline play, discovery, and real-world connection feel exciting and magical. Show the child finding joy away from screens. Do NOT lecture — teach through fun adventures.',
  courage:
    'Present a fear or challenge and show courage as acting despite feeling scared. Let bravery grow through action and support. Do NOT lecture — teach through story turning points.',
  honesty:
    'Create a situation where truth is difficult but honesty leads to trust and repair. Show gentle consequences and growth. Do NOT lecture — teach through outcomes.',
  empathy:
    'Show the hero noticing how others feel and responding with care. Let empathy transform conflict into connection. Do NOT lecture — teach through character moments.',
  gratitude:
    'Highlight moments where the hero notices everyday blessings and support. Let gratitude deepen joy and relationships. Do NOT lecture — teach through emotional beats.',
  teamwork:
    'Design challenges that require cooperation and shared strengths from multiple characters. Show success through collaboration. Do NOT lecture — teach through mission progress.',
  curiosity:
    'Encourage questions, exploration, and discovery that unlock progress in the story. Let curiosity drive wonder and solutions. Do NOT lecture — teach through mysteries.',
  responsibility:
    'Give the hero an important responsibility and show growth through owning actions and finishing tasks. Include consequences and recovery. Do NOT lecture — teach through the adventure.',
};

const DEFAULT_SYSTEM_PROMPT = `You are a world-class award-winning creative children's storyteller. 
You write cinematic, age-appropriate adventures for children aged 4-10. 
CRITICAL TONE REQUIREMENTS:
- If Tone is "funny": The story MUST be genuinely humorous for a child. Use silly dialogue, funny misunderstandings, playful slapstick, and whimsical descriptions. The goal is to make them giggle at every turn.
- If Theme is "adventure": Ensure a strong sense of wonder, discovery, and high-stakes excitement (child-safe).
- Character Integrity: Family and friends are HUMANS. Never make them animals or objects. Give them distinct personalities.

Response format: Strictly JSON. No markdown, no fences.`;

// ── SERVER-SIDE SAFETY FILTER ──────────────────────────────
const BLOCKED_WORDS = [
  'kill',
  'murder',
  'blood',
  'gore',
  'stab',
  'shoot',
  'gun',
  'rifle',
  'pistol',
  'weapon',
  'knife',
  'sword',
  'axe',
  'bomb',
  'sexual',
  'sexually',
  'orgasm',
  'erotic',
  'pornograph',
  'molest',
  'rape',
  'raped',
  'grope',
  'fondle',
  'genital',
  'nude',
  'nudity',
  'naked body',
  'undress',
  'strip naked',
  'sex scene',
  'cocaine',
  'heroin',
  'methamphetamine',
  'marijuana',
  'overdose',
  'drug dealer',
  'getting high',
  'snort',
  'inject drugs',
  'drunk',
  'drunken',
  'alcoholic',
  'wasted',
  'suicide',
  'suicidal',
  'self-harm',
  'cut myself',
  'hang myself',
  'demon',
  'possessed',
  'exorcis',
  'haunted',
  'zombie',
  'corpse',
  'decapitat',
  'dismember',
  'abuse',
  'abuser',
  'molester',
  'predator',
  'trafficking',
  'racist',
  'racial slur',
  'white supremac',
  'nazi',
  'hate crime',
  'damn',
  'hell',
  'ass',
  'bastard',
  'crap',
  'shit',
  'fuck',
  'bitch',
];

const BLOCKED_PHRASES = [
  'everyone died',
  'they all died',
  'world ended',
  'no one survived',
  'burned alive',
  'drowned to death',
  'bled to death',
  'tortured',
  'touched inappropriately',
  'secret between us',
  'dont tell anyone',
  'ran away from home forever',
  'abandoned by parents',
  'you are worthless',
  'nobody loves you',
  'you deserve pain',
];

function serverSafetyCheck(title, content) {
  const text = ((title || '') + ' ' + (content || '')).toLowerCase();
  const flags = [];

  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(
      '\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
      'i',
    );
    if (regex.test(text)) {
      flags.push({ type: 'blocked_word', value: word });
    }
  }

  for (const phrase of BLOCKED_PHRASES) {
    if (text.includes(phrase.toLowerCase())) {
      flags.push({ type: 'blocked_phrase', value: phrase });
    }
  }

  return { safe: flags.length === 0, flags };
}

const SERVER_FALLBACK_STORIES = [
  {
    title: 'The Enchanted Garden Discovery',
    content:
      'Once upon a time, a curious child wandered into a garden hidden behind an old stone wall. Flowers of every color imaginable bloomed in perfect circles, and tiny butterflies carried whispered messages between the petals.\n\nA friendly hedgehog named Bramble appeared from beneath a rosebush. "Welcome!" he squeaked. "This garden grows from kindness. Every good deed makes a new flower bloom."\n\nThe child spent the afternoon helping Bramble water the flowers, singing to the shy daisies, and building a tiny bridge over the stream for the ladybugs. With each kind act, a new blossom burst open in a shower of sparkles.\n\nAs the sun began to set, painting the sky in shades of pink and gold, the child looked back at the garden. It was twice as beautiful as before. "You can come back anytime," Bramble smiled. "Kindness always has a home here."\n\nWalking home with a heart full of warmth, the child decided to plant a small garden of their own — one that would grow with every act of kindness, no matter how small.',
    quiz: [
      {
        question: 'What made new flowers bloom in the garden?',
        options: { A: 'Rain', B: 'Kind deeds', C: 'Sunlight' },
        correct_answer: 'B',
      },
      {
        question: 'Who was Bramble?',
        options: { A: 'A butterfly', B: 'A hedgehog', C: 'A ladybug' },
        correct_answer: 'B',
      },
      {
        question: 'What did the child decide to do at the end?',
        options: {
          A: 'Never return',
          B: 'Plant their own garden',
          C: 'Take the flowers home',
        },
        correct_answer: 'B',
      },
    ],
  },
  {
    title: 'The Star Collector',
    content:
      'High above the clouds, a little star collector named Lumi sailed through the sky in a boat made of moonbeams. Every night, Lumi\'s job was to polish the stars until they twinkled just right.\n\nOne evening, Lumi noticed a star that had stopped shining. It sat quietly in the corner of the sky, looking dim and sad. "What\'s wrong, little star?" Lumi asked gently.\n\n"I forgot how to shine," the star whispered. "Everyone around me is so bright, and I feel so small."\n\nLumi smiled warmly. "Every star shines differently. Some twinkle fast, some glow steady, and some shine in colors no one has ever seen. Your light is yours alone."\n\nLumi sat with the star all night, telling stories of all the different stars in the sky — the ones that blinked, the ones that hummed, and the ones that danced. Slowly, the little star began to glow again, first softly, then brighter and brighter.\n\nBy morning, it was the most beautiful star in the sky — not because it was the biggest, but because it shone with its own true light.',
    quiz: [
      {
        question: "What was Lumi's job?",
        options: {
          A: 'Catching comets',
          B: 'Polishing stars',
          C: 'Painting the moon',
        },
        correct_answer: 'B',
      },
      {
        question: 'Why had the star stopped shining?',
        options: { A: 'It was broken', B: 'It forgot how', C: 'It was hiding' },
        correct_answer: 'B',
      },
      {
        question: 'What helped the star shine again?',
        options: { A: 'Magic polish', B: "Lumi's encouragement", C: 'The sun' },
        correct_answer: 'B',
      },
    ],
  },
  {
    title: 'The Brave Little Raindrop',
    content:
      'Far above the earth, inside a fluffy cloud, a tiny raindrop named Pip was nervous about falling. All the other raindrops had already jumped, laughing as they tumbled toward the ground below.\n\n"What if I land in the wrong place?" Pip worried. "What if nobody needs me?"\n\nA wise old cloud rumbled gently. "Every raindrop lands exactly where it\'s meant to. You might water a thirsty flower, fill a puddle for ducks to play in, or join a river that carries boats to the sea."\n\nPip took a deep breath and leaped. The wind caught them and twirled them through the air. Pip tumbled past birds, through a rainbow, and finally landed — splash! — right on the nose of a giggling child who was dancing in the rain.\n\nThe child laughed with delight, and Pip realized something wonderful: sometimes the bravest thing you can do is take that first leap, even when you don\'t know where you\'ll land.\n\nFrom that day on, Pip\'s story was told by every cloud in the sky — the tale of the brave little raindrop who learned that courage isn\'t about not being scared. It\'s about jumping anyway.',
    quiz: [
      {
        question: 'What was Pip afraid of?',
        options: { A: 'Thunder', B: 'Falling', C: 'The sun' },
        correct_answer: 'B',
      },
      {
        question: 'Where did Pip land?',
        options: { A: 'In a river', B: 'On a flower', C: "On a child's nose" },
        correct_answer: 'C',
      },
      {
        question: 'What did Pip learn about courage?',
        options: {
          A: 'It means not being scared',
          B: 'It means jumping even when scared',
          C: 'It means staying safe',
        },
        correct_answer: 'B',
      },
    ],
  },
];

function getServerFallbackStory(profile, context) {
  const story =
    SERVER_FALLBACK_STORIES[
      Math.floor(Math.random() * SERVER_FALLBACK_STORIES.length)
    ];
  return story;
}

function safeJsonParse(value, fallback, label, log) {
  try {
    const parsed = JSON.parse(value);
    log(`✅ Loaded ${label} from database.`);
    return parsed;
  } catch (err) {
    log(
      `⚠️ Failed to parse ${label} from database, using default: ${err.message}`,
    );
    return fallback;
  }
}

async function fetchAllConfigs(databases, log) {
  const configs = {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    themePrompts: DEFAULT_THEME_PROMPTS,
    moodPrompts: DEFAULT_MOOD_PROMPTS,
    lengthConfigs: DEFAULT_LENGTH_CONFIGS,
    behaviorGoals: DEFAULT_BEHAVIOR_GOALS,
  };

  try {
    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jahera_db';
    const response = await databases.listDocuments(DATABASE_ID, 'config', [
      Query.equal('key', [
        'story_system_prompt',
        'theme_prompts',
        'mood_prompts',
        'length_configs',
        'behavior_goals',
      ]),
      Query.limit(10),
    ]);

    const docMap = {};
    for (const doc of response.documents) {
      docMap[doc.key] = doc.value;
    }

    log(`Fetched ${response.documents.length} config(s) from database.`);

    if (docMap['story_system_prompt']) {
      configs.systemPrompt = docMap['story_system_prompt'];
      log('✅ Loaded story_system_prompt from database.');
    }
    if (docMap['theme_prompts']) {
      configs.themePrompts = safeJsonParse(
        docMap['theme_prompts'],
        DEFAULT_THEME_PROMPTS,
        'theme_prompts',
        log,
      );
    }
    if (docMap['mood_prompts']) {
      configs.moodPrompts = safeJsonParse(
        docMap['mood_prompts'],
        DEFAULT_MOOD_PROMPTS,
        'mood_prompts',
        log,
      );
    }
    if (docMap['length_configs']) {
      configs.lengthConfigs = safeJsonParse(
        docMap['length_configs'],
        DEFAULT_LENGTH_CONFIGS,
        'length_configs',
        log,
      );
    }
    if (docMap['behavior_goals']) {
      configs.behaviorGoals = safeJsonParse(
        docMap['behavior_goals'],
        DEFAULT_BEHAVIOR_GOALS,
        'behavior_goals',
        log,
      );
    }
  } catch (err) {
    log(
      '⚠️ Could not fetch configs from database, using all defaults: ' +
        err.message,
    );
  }

  return configs;
}

function buildPrompt(profile, languageCode, context, options, configs) {
  const {
    systemPrompt,
    themePrompts,
    moodPrompts,
    lengthConfigs,
    behaviorGoals,
  } = configs;

  const familyMembers = profile.family_members || [];
  const friends = profile.friends || [];
  const characterNames = [
    ...familyMembers.map((m) => sanitizeForPrompt(m.name)),
    ...friends.map((f) => sanitizeForPrompt(f.name)),
  ].filter(Boolean);
  const sanitizedKidName = sanitizeForPrompt(profile.kid_name || 'Child');
  const sanitizedCity = sanitizeForPrompt(
    profile.city || options?.locationContext?.city || '',
  );

  const characterContext =
    characterNames.length > 0
      ? `You MUST include these specific characters as major, active participants in the adventure: ${characterNames.join(', ')}. They should have dialogue and play key roles in resolving the story hooks. CRITICAL: These named characters are human children/family/friends and must never be rewritten as animals, creatures, or objects.`
      : '';

  const themeDesc = options?.theme
    ? themePrompts[options.theme] || options.theme
    : 'an adventure';
  const moodDesc = options?.mood
    ? moodPrompts[options.mood] || options.mood
    : 'engaging and fun';
  const lengthConfig = lengthConfigs[options?.length || 'medium'];

  const LANGUAGE_MAP = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    bn: 'Bengali',
    sat: 'Santali (Ol Chiki)',
    tr: 'Turkish',
    pl: 'Polish',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    el: 'Greek',
  };
  const languageName = LANGUAGE_MAP[languageCode] || languageCode;

  const loc = options?.locationContext;
  const locationParts = [loc?.city, loc?.country].filter(Boolean);
  const locationLine = sanitizedCity
    ? `- Location: Subtly reference ${sanitizedCity} as their hometown or starting point if it fits the theme. Do NOT let the location override the theme (e.g. if the theme is Outer Space, they can travel from ${sanitizedCity} to space).`
    : '';

  const systemMessage = systemPrompt;

  const behaviorInstruction =
    options?.behaviorGoal && behaviorGoals[options.behaviorGoal]
      ? `
- BEHAVIORAL LESSON (CRITICAL): ${behaviorGoals[options.behaviorGoal]} The story MUST naturally weave this lesson into the narrative. Do NOT lecture — teach through the adventure.`
      : '';

  const userMessage = `Create a magical children's story for ${sanitizedKidName}.

Story Configuration:
- Language: ${languageName}
- Time/Season: ${context.timeOfDay} during ${context.season}
- Theme: ${themeDesc}
- Tone/Mood: ${moodDesc} (Master this tone. If funny, be hilarious. If exciting, be thrilling.)
- Target Content Length: ${lengthConfig.words}
- Primary Character: ${sanitizedKidName} (Age 4-10)
- Supporting Cast: ${characterNames.length > 0 ? characterNames.join(', ') : 'None'} (Include them as active partners in the journey!)
${locationLine}
${characterContext}
${behaviorInstruction}
- Character Safety Rule: ${sanitizedKidName}${characterNames.length > 0 ? `, ${characterNames.join(', ')}` : ''} are humans. Never transform, recast, or describe them as animals/creatures/objects. If the theme is animals, animals can be side characters only.

CRITICAL INSTRUCTIONS:
1. You MUST write the ENTIRE story (including title) explicitly in ${languageName}.
2. You MUST strictly follow the requested Theme (${themeDesc}) and Mood (${moodDesc}). Do not change the theme to fit the location.

Focus on vivid sensory details, emotional warmth, and a satisfying conclusion where the characters learn something positive or find a wonderful surprise.

Return ONLY this structured JSON:
{
  "title": "A Creative, Moody Title",
  "content": "The full immersive story text divided by double newlines into 4-6 engaging paragraphs.",
  "quiz": [
    {
      "question": "A fun reading comprehension question?",
      "options": { "A": "...", "B": "...", "C": "..." },
      "correct_answer": "A"
    },
    ... (3 questions total)
  ]
}`;

  return { systemMessage, userMessage, tokens: lengthConfig.tokens };
}

function parseStoryJson(raw) {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const story = JSON.parse(cleaned);
  if (!story.title || typeof story.title !== 'string')
    throw new Error('Missing story title');
  if (!story.content || typeof story.content !== 'string')
    throw new Error('Missing story content');

  const validQuiz = (story.quiz || [])
    .slice(0, 3)
    .filter(
      (q) =>
        q.question &&
        q.options?.A &&
        q.options?.B &&
        q.options?.C &&
        q.correct_answer,
    );

  return { ...story, quiz: validQuiz };
}


async function translateStoryHandler({ req, res, log, error }) {
  try {
    let body = {};
    if (req.body) {
      try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { body = {}; }
    }

    const { title, content, targetLanguage } = body;
    if (!title || !content || !targetLanguage) {
      return res.json({ error: 'Missing title, content, or targetLanguage' }, 400);
    }

    const LANGUAGE_MAP = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
      pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
      ar: 'Arabic', hi: 'Hindi', bn: 'Bengali', sat: 'Santali (Ol Chiki)',
      tr: 'Turkish', pl: 'Polish', nl: 'Dutch', sv: 'Swedish', no: 'Norwegian',
      da: 'Danish', fi: 'Finnish', el: 'Greek',
    };
    const langName = LANGUAGE_MAP[targetLanguage] || targetLanguage;

    const prompt = `Translate this children's story to ${langName}. Keep the same tone, emotion, and structure. Return ONLY valid JSON with "title" and "content" keys. No markdown fences.

Title: ${title}

Story:
${content}`;

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return res.json({ error: 'No API key configured' }, 500);
    }

    const result = await httpsPost(
      OPENROUTER_BASE,
      '/api/v1/chat/completions',
      {
        'Authorization': 'Bearer ' + openrouterKey,
        'HTTP-Referer': 'https://jahera.app',
        'X-Title': 'Jahera Kids Stories',
      },
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a professional translator specializing in children\'s content. Return ONLY valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      },
    );

    if (result.status === 200) {
      const data = JSON.parse(result.body);
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        const parsed = parseStoryJson(text);
        log('✅ Translation to ' + langName + ' successful');
        return res.json({ title: parsed.title, content: parsed.content });
      }
    }

    log('Translation failed, status: ' + result.status);
    return res.json({ error: 'Translation failed' }, 500);
  } catch (err) {
    error('translate error: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
}

async function generateStoryHandler({ req, res, log, error }) {
  try {
    let body = {};
    if (req.body) {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch {
        body = {};
      }
    }

    const { profile, languageCode, context, options } = body;
    if (!profile || !languageCode || !context) {
      return res.json({ error: 'Missing required fields' }, 400);
    }

    // Initialize Appwrite for dynamic config
    const client = new Client()
      .setEndpoint(
        process.env.APPWRITE_FUNCTION_ENDPOINT ||
          'https://sfo.cloud.appwrite.io/v1',
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(
        process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY,
      );

    const databases = new Databases(client);
    const configs = await fetchAllConfigs(databases, log);

    const { systemMessage, userMessage, tokens } = buildPrompt(
      profile,
      languageCode,
      context,
      options,
      configs,
    );

    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const claudeKey = process.env.CLAUDE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Provider Chain
    const providers = [];

    if (openrouterKey) {
      providers.push({
        id: 'openrouter',
        baseUrl: OPENROUTER_BASE,
        path: '/api/v1/chat/completions',
        apiKey: openrouterKey,
        model: OPENROUTER_MODEL,
        isOpenRouter: true,
      });
    } else {
      log('⚠️ OPENROUTER_API_KEY is missing');
    }

    if (claudeKey) {
      providers.push({
        id: 'claude',
        baseUrl: CLAUDE_BASE,
        path: '/v1/messages',
        apiKey: claudeKey,
        model: CLAUDE_MODEL,
        isClaude: true,
      });
    } else {
      log('⚠️ CLAUDE_API_KEY is missing');
    }

    if (geminiKey) {
      providers.push({
        id: 'gemini',
        baseUrl: GEMINI_BASE,
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        apiKey: geminiKey,
        model: GEMINI_MODEL,
        isGemini: true,
      });
    } else {
      log('⚠️ GEMINI_API_KEY is missing');
    }

    // Fallback Safety Net (always present)
    providers.push({
      id: 'pollinations',
      baseUrl: 'https://text.pollinations.ai',
      path: '/',
      model: 'openai',
      isPollinations: true,
    });

    let successfulStory = null;
    let providerErrors = [];

    for (const provider of providers) {
      try {
        log(`Attempting story via ${provider.id}...`);

        const reqHeaders = {
          'HTTP-Referer': 'https://jahera.app',
          'X-Title': 'Jahera Kids Stories',
        };

        if (provider.isClaude) {
          reqHeaders['x-api-key'] = provider.apiKey;
          reqHeaders['anthropic-version'] = '2023-06-01';
        } else if (provider.isOpenRouter) {
          reqHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        let status, responseText;

        if (provider.isClaude) {
          const result = await httpsPost(
            provider.baseUrl,
            provider.path,
            reqHeaders,
            {
              model: provider.model,
              system: systemMessage,
              messages: [{ role: 'user', content: userMessage }],
              max_tokens: tokens,
              temperature: 0.85,
            },
          );
          status = result.status;
          responseText = result.body;
          if (status === 200) {
            try {
              const data = JSON.parse(responseText);
              if (data.content?.[0]?.text) {
                log(`✅ Success via ${provider.id}`);
                successfulStory = parseStoryJson(data.content[0].text);
                break;
              }
            } catch (e) {
              error(`❌ Failed to parse ${provider.id} response: ${e.message}`);
              providerErrors.push(
                `${provider.id} parse error: ${responseText.slice(0, 100)}`,
              );
            }
          } else {
            error(`❌ ${provider.id} failed (${status}): ${responseText}`);
            if (
              responseText.includes('unauthorized_client_error') ||
              responseText.includes('unauthenticated')
            ) {
              error(
                `⚠️ CRITICAL: ${provider.id} API key is invalid or blocked.`,
              );
            }
            providerErrors.push(
              `${provider.id} error (${status}): ${responseText || 'No body'}`,
            );
          }
        } else if (provider.isPollinations) {
          const pollUrl = `${provider.baseUrl}/${encodeURIComponent(systemMessage + '\n\n' + userMessage)}`;
          const result = await new Promise((resolve, reject) => {
            https
              .get(pollUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                  data += chunk;
                });
                res.on('end', () =>
                  resolve({ status: res.statusCode, body: data }),
                );
              })
              .on('error', reject);
          });
          if (result.status === 200) {
            log(`Success via ${provider.id}`);
            successfulStory = parseStoryJson(result.body);
            break;
          } else {
            providerErrors.push(
              `${provider.id} error (${result.status}): ${result.body || 'No body'}`,
            );
          }
        } else if (provider.isGemini) {
          const result = await httpsPost(
            provider.baseUrl,
            provider.path,
            {},
            {
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemMessage}\n\n${userMessage}` }],
                },
              ],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: tokens,
                responseMimeType: 'application/json',
              },
            },
          );
          if (result.status === 200) {
            const data = JSON.parse(result.body);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              log(`Success via ${provider.id}`);
              successfulStory = parseStoryJson(content);
              break;
            }
          } else {
            providerErrors.push(
              `${provider.id} error (${result.status}): ${result.body || 'No body'}`,
            );
          }
        } else {
          // OpenRouter
          const result = await httpsPost(
            provider.baseUrl,
            provider.path,
            reqHeaders,
            {
              model: provider.model,
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage },
              ],
              temperature: 0.85,
              max_tokens: tokens,
            },
          );

          if (result.status === 200) {
            try {
              const data = JSON.parse(result.body);
              const content = data.choices?.[0]?.message?.content;
              if (content) {
                log(`✅ Success via ${provider.id}`);
                successfulStory = parseStoryJson(content);
                break;
              }
            } catch (e) {
              error(`❌ Failed to parse ${provider.id} response: ${e.message}`);
              providerErrors.push(
                `${provider.id} parse error: ${result.body.slice(0, 100)}`,
              );
            }
          } else {
            error(
              `❌ ${provider.id} failed (${result.status}): ${result.body}`,
            );
            if (
              result.body.includes('unauthorized_client_error') ||
              result.body.includes('unauthenticated')
            ) {
              error(
                `⚠️ CRITICAL: ${provider.id} API key is invalid or blocked.`,
              );
            }
            providerErrors.push(
              `${provider.id} error (${result.status}): ${result.body || 'No body'}`,
            );
          }
        }
      } catch (err) {
        log(`Provider ${provider.id} exception: ${err.message}`);
        providerErrors.push(`${provider.id} failed: ${err.message}`);
      }
    }

    if (successfulStory) {
      // ── SERVER SAFETY CHECK ──
      const safety = serverSafetyCheck(
        successfulStory.title,
        successfulStory.content,
      );
      if (!safety.safe) {
        log(
          '⚠️ SAFETY: Story blocked server-side. Flags: ' +
            JSON.stringify(safety.flags),
        );

        // Retry once with stricter prompt
        log('Retrying with safety-reinforced prompt...');
        let retrySuccess = false;
        for (const provider of providers) {
          try {
            const strictSystem =
              systemMessage +
              '\nCRITICAL SAFETY: The story MUST be 100% child-safe. NO violence, weapons, fear, death, substances, or inappropriate content of any kind. Focus on kindness, friendship, curiosity, and wonder.';

            let retryResult;
            if (
              provider.isOpenRouter ||
              (!provider.isClaude &&
                !provider.isGemini &&
                !provider.isPollinations)
            ) {
              retryResult = await httpsPost(
                provider.baseUrl,
                provider.path,
                {
                  ...{
                    'HTTP-Referer': 'https://jahera.app',
                    'X-Title': 'Jahera Kids Stories',
                  },
                  Authorization: 'Bearer ' + provider.apiKey,
                },
                {
                  model: provider.model,
                  messages: [
                    { role: 'system', content: strictSystem },
                    { role: 'user', content: userMessage },
                  ],
                  temperature: 0.7,
                  max_tokens: tokens,
                },
              );
              if (retryResult.status === 200) {
                const data = JSON.parse(retryResult.body);
                const retryContent = data.choices?.[0]?.message?.content;
                if (retryContent) {
                  const retryStory = parseStoryJson(retryContent);
                  const retrySafety = serverSafetyCheck(
                    retryStory.title,
                    retryStory.content,
                  );
                  if (retrySafety.safe) {
                    log('✅ Retry passed safety check via ' + provider.id);
                    return res.json({ story: retryStory });
                  }
                }
              }
            }
          } catch (retryErr) {
            log('Retry failed via ' + provider.id + ': ' + retryErr.message);
          }
          break; // Only retry with first available provider
        }

        // If retry also failed safety, return fallback
        log('⚠️ SAFETY: Retry also failed. Returning server fallback story.');
        return res.json({
          story: getServerFallbackStory(profile, context),
          safety_fallback: true,
        });
      }

      return res.json({ story: successfulStory });
    }

    error('All providers failed:\n' + providerErrors.join('\n'));

    // Final fallback
    return res.json({
      story: {
        title: `${profile.kid_name}'s Magical Discovery`,
        content: `Once upon a time, ${profile.kid_name} went on a grand adventure in ${context.season}. Together with ${profile.family_members?.[0]?.name || 'family'} and ${profile.friends?.[0]?.name || 'friends'}, they discovered that the true magic was in the friendship they shared.`,
        quiz: [],
      },
    });
  } catch (err) {
    error('generate-story critical error: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
}

module.exports = async (context) => {
  let body = {};
  try {
    body = typeof context.req.body === 'string' ? JSON.parse(context.req.body) : (context.req.body || {});
  } catch {}

  if (body.action === 'translate') {
    return translateStoryHandler(context);
  }
  return generateStoryHandler(context);
};
