const https = require('https');

const THEME_PROMPTS = {
  adventure: 'an exciting adventure with exploration and discovery',
  fantasy: 'a magical fantasy world with spells, dragons, and wonder',
  magic: 'a magical world with spells and wonder',
  animals: 'friendly animals as the main characters',
  space: 'outer space, stars, and planets',
  ocean: 'the deep ocean and colourful sea creatures',
  forest: 'an enchanted forest full of secrets',
  dinosaurs: 'dinosaurs and prehistoric times',
  superheroes: 'superheroes with special powers',
  heroes: 'brave heroes overcoming challenges',
  nature: 'the beauty of nature, plants, and wildlife',
  science: 'science, invention, and curious discoveries',
};

const MOOD_PROMPTS = {
  funny: 'funny, playful, and full of silly humour',
  exciting: 'exciting, fast-paced, and full of action',
  calming: 'calm, peaceful, and soothing',
  calm: 'calm, peaceful, and soothing',
  mysterious: 'mysterious and intriguing',
  educational: 'educational and informative — teaching a fun fact',
};

const LENGTH_CONFIGS = {
  short: { words: '200-280 words', tokens: 1100 },
  medium: { words: '350-500 words', tokens: 1800 },
  long: { words: '600-800 words', tokens: 2800 },
};

const OPENROUTER_BASE = 'https://openrouter.ai';
const OPENAI_BASE = 'https://api.openai.com';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const OPENAI_MODEL = 'gpt-4o-mini';

function httpsPost(baseUrl, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const url = new URL(baseUrl);
    const options = {
      hostname: url.hostname,
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function buildPrompt(profile, languageCode, context, options) {
  const characterNames = [
    ...(profile.family_members || []).map(m => m.name),
    ...(profile.friends || []).map(f => f.name),
  ];
  const characterContext = characterNames.length > 0
    ? `Include these characters: ${characterNames.join(', ')}.`
    : '';

  const themeDesc = options?.theme ? (THEME_PROMPTS[options.theme] || options.theme) : 'an adventure';
  const moodDesc = options?.mood ? (MOOD_PROMPTS[options.mood] || options.mood) : 'engaging and fun';
  const lengthConfig = LENGTH_CONFIGS[options?.length || 'medium'];

  const loc = options?.locationContext;
  const locationParts = [loc?.city, loc?.country].filter(Boolean);
  const locationLine = locationParts.length > 0
    ? `- Location: Set the story in or around ${locationParts.join(', ')} — weave in local landmarks, nature, or culture naturally`
    : '';

  const systemMessage = `You are a creative children's story writer. You write engaging, age-appropriate stories for children aged 4-10. Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

  const userMessage = `Write a children's story for a child named ${profile.kid_name}.

Requirements:
- Language: ${languageCode}
- Setting: ${context.season} season, ${context.timeOfDay}
- Theme: ${themeDesc}
- Tone: ${moodDesc}
- Length: ${lengthConfig.words}
- Age group: 4-10 years old
- Must be educational and positive
- Structure: write in 4-6 clear paragraphs separated by newlines, with a proper story arc (beginning, middle, end)
${locationLine}
${characterContext}

Return ONLY this JSON structure (no markdown, no extra keys):
{
  "title": "Story title here",
  "content": "Full story text here",
  "quiz": [
    {
      "question": "A question about the story?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "A"
    },
    {
      "question": "Another question?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "B"
    },
    {
      "question": "Third question?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "C"
    }
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
  if (!story.title || typeof story.title !== 'string') throw new Error('Missing story title');
  if (!story.content || typeof story.content !== 'string') throw new Error('Missing story content');
  if (!Array.isArray(story.quiz) || story.quiz.length < 2) throw new Error('Missing or incomplete quiz');

  const validQuiz = story.quiz.slice(0, 3).filter(q =>
    q.question && q.options?.A && q.options?.B && q.options?.C && q.correct_answer
  );
  if (validQuiz.length < 2) throw new Error('Quiz questions are malformed');

  return { ...story, quiz: validQuiz };
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

    const { profile, languageCode, context, options } = body;

    if (!profile || !languageCode || !context) {
      return res.json({ error: 'Missing required fields: profile, languageCode, context' }, 400);
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let apiKey = null;
    let provider = null;

    if (openrouterKey && openrouterKey.startsWith('sk-or-') && openrouterKey.length > 20) {
      apiKey = openrouterKey;
      provider = 'openrouter';
    } else if (openaiKey && openaiKey.startsWith('sk-') && openaiKey.length > 20) {
      apiKey = openaiKey;
      provider = 'openai';
    }

    if (!apiKey) {
      return res.json({ error: 'No AI API key configured on server. Add OPENROUTER_API_KEY or OPENAI_API_KEY to function environment variables.' }, 500);
    }

    const { systemMessage, userMessage, tokens } = buildPrompt(profile, languageCode, context, options);

    const isOpenRouter = provider === 'openrouter';
    const baseUrl = isOpenRouter ? OPENROUTER_BASE : OPENAI_BASE;
    const model = isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL;

    const reqHeaders = {
      'Authorization': `Bearer ${apiKey}`,
    };
    if (isOpenRouter) {
      reqHeaders['HTTP-Referer'] = 'https://jahera.app';
      reqHeaders['X-Title'] = 'Jahera Kids Stories';
    }

    const { status, body: responseText } = await httpsPost(
      baseUrl,
      '/v1/chat/completions',
      reqHeaders,
      {
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: tokens,
        response_format: { type: 'json_object' },
      }
    );

    if (status === 429) {
      return res.json({ error: 'API quota exceeded. Please check your plan or try again later.', quotaExceeded: true }, 429);
    }
    if (status === 401) {
      return res.json({ error: `Invalid API key for ${isOpenRouter ? 'OpenRouter' : 'OpenAI'}. Check Function environment variables.` }, 401);
    }
    if (status !== 200) {
      return res.json({ error: `AI API error: ${status}` }, 500);
    }

    const data = JSON.parse(responseText);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.json({ error: 'Empty response from AI provider' }, 500);
    }

    const story = parseStoryJson(content);
    return res.json({ story });
  } catch (err) {
    error('generate-story error: ' + err.message);
    return res.json({ error: err.message || 'Unknown error' }, 500);
  }
};
