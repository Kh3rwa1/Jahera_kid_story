const https = require('https');
const url = require('url');

/**
 * Robust HTTPS POST helper with timeout
 */
function httpsPost(baseUrl, path, headers, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = baseUrl.startsWith('http') ? baseUrl + path : `https://${baseUrl}${path}`;
    const parsedUrl = url.parse(fullUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Provider request timed out after 25s'));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}


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
const CLAUDE_BASE = 'https://api.anthropic.com';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const GEMINI_MODEL = 'gemini-2.0-flash'; // Free tier: 1500 req/day

function httpsPost(baseUrl, path, headers, body, timeoutMs = 18000) {
  const bodyStr = JSON.stringify(body);
  const url = new URL(baseUrl);
  
  const requestPromise = new Promise((resolve, reject) => {
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

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Provider request timed out')), timeoutMs);
  });

  return Promise.race([requestPromise, timeoutPromise]);
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
    const claudeKey = process.env.CLAUDE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openrouterKey && !claudeKey && !geminiKey) {
      log('No AI keys configured. Story generation will fail until keys are added to Appwrite console.');
    }

    const { systemMessage, userMessage, tokens } = buildPrompt(profile, languageCode, context, options);

    // Build provider chain - prioritized order
    const providers = [];

    // Priority 1: OpenRouter (Primary Default)
    if (openrouterKey && openrouterKey.length > 20) {
      providers.push({
        id: 'openrouter',
        baseUrl: OPENROUTER_BASE,
        path: '/api/v1/chat/completions',
        apiKey: openrouterKey,
        model: OPENROUTER_MODEL,
        isOpenRouter: true
      });
    }

    // Priority 2: Dedicated Claude (Anthropic)
    if (claudeKey && claudeKey.startsWith('sk-ant-')) {
      providers.push({
        id: 'claude',
        baseUrl: CLAUDE_BASE,
        path: '/v1/messages',
        apiKey: claudeKey,
        model: CLAUDE_MODEL,
        isClaude: true
      });
    }

    // Priority 3: Google Gemini (generous free tier)
    if (geminiKey && geminiKey.length > 10) {
      providers.push({
        id: 'gemini',
        baseUrl: GEMINI_BASE,
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        apiKey: geminiKey,
        model: GEMINI_MODEL,
        isGemini: true
      });
    }

    // Priority 4: Pollinations AI (Ultimate Zero-Key Fallback)
    providers.push({
      id: 'pollinations',
      baseUrl: 'https://text.pollinations.ai',
      path: '/',
      model: 'openai', // Pollinations uses this slug for their main text router
      isPollinations: true
    });

    let lastError = 'No valid providers configured';
    let successfulStory = null;

    for (const provider of providers) {
      try {
        log(`Attempting story generation via ${provider.id} using model ${provider.model}...`);
        
        const reqHeaders = {
          'HTTP-Referer': 'https://jahera.app',
          'X-Title': 'Jahera Kids Stories',
          'User-Agent': 'Mozilla/5.0 (compatible; JaheraBot/1.0)',
        };

        // Handle provider-specific headers
        if (provider.isClaude) {
          reqHeaders['x-api-key'] = provider.apiKey;
          reqHeaders['anthropic-version'] = '2023-06-01';
        } else if (provider.isOpenRouter) {
          reqHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        let status, responseText;

        if (provider.isClaude) {
          // Claude uses a top-level system parameter and different message format
          const claudeBody = {
            model: provider.model,
            system: systemMessage,
            messages: [{ role: 'user', content: userMessage }],
            max_tokens: tokens,
            temperature: 0.85,
          };
          const result = await httpsPost(provider.baseUrl, provider.path, reqHeaders, claudeBody);
          status = result.status;
          responseText = result.body;

          if (status === 200) {
            const data = JSON.parse(responseText);
            const content = data.content?.[0]?.text;
            if (content) {
              successfulStory = parseStoryJson(content);
              log(`Success! Story generated via ${provider.id} (Claude)`);
              break;
            }
          } else {
            error(`${provider.id} error (Status ${status}): ${responseText}`);
            lastError = `Claude failed with status ${status}`;
          }
          continue;
        }

        if (provider.isPollinations) {
          // Pollinations is a simple text prompt
          const pollUrl = `${provider.baseUrl}/${encodeURIComponent(systemMessage + '\n\n' + userMessage)}`;
          // Pollinations uses GET for simple requests
          const result = await new Promise((resolve, reject) => {
            https.get(pollUrl, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }).on('error', reject);
          });
          
          status = result.status;
          responseText = result.body;

          if (status === 200) {
            successfulStory = parseStoryJson(responseText);
            log(`Success! Story generated via ${provider.id} (Safety Net)`);
            break;
          } else {
            error(`${provider.id} error: ${responseText}`);
            lastError = `Safety Net failed with status ${status}`;
          }
          continue;
        }

        if (provider.isGemini) {
          // Gemini uses a different request format
          const geminiBody = {
            contents: [{
              role: 'user',
              parts: [{ text: `${systemMessage}\n\n${userMessage}` }]
            }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: tokens,
              responseMimeType: 'application/json',
            }
          };
          const result = await httpsPost(provider.baseUrl, provider.path, {}, geminiBody);
          status = result.status;
          responseText = result.body;

          if (status === 200) {
            const data = JSON.parse(responseText);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              successfulStory = parseStoryJson(content);
              log(`Success! Story generated via ${provider.id} (Gemini)`);
              break;
            }
          } else {
            error(`${provider.id} error (Status ${status}): ${responseText}`);
            lastError = `Gemini failed with status ${status}`;
          }
          continue; // Skip the standard OpenAI response parsing below
        }

        const result2 = await httpsPost(
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
            response_format: { type: 'json_object' },
          }
        );
        status = result2.status;
        responseText = result2.body;

        if (status === 200) {
          const data = JSON.parse(responseText);
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            successfulStory = parseStoryJson(content);
            log(`Success! Story generated via ${provider.id}`);
            break;
          }
        } else {
          error(`${provider.id} error (Status ${status}): ${responseText}`);
          lastError = `AI Provider ${provider.id} failed with status ${status}`;
        }
      } catch (err) {
        error(`Error during ${provider.id} attempt: ${err.message}`);
        lastError = err.message;
      }
    }

    if (successfulStory) {
      return res.json({ story: successfulStory });
    }

    // FINAL MAGIC BACKUP - Return 100% reliable fallback story if everything else is down
    const fallbackStory = {
      title: `${profile.name}'s Magical Discovery`,
      content: `Once upon a time, ${profile.name} went on a grand journey in a ${options?.theme || 'magical'} world. Exploring far and wide, ${profile.name} discovered a secret hidden deep within the heart of the kingdom. It was a ${options?.mood || 'wonderful'} surprise that would change everything forever. The stars shone brightly as the mystery unfolded, leading to characters who would become lifelong friends. Every step of the way was filled with magic and wonder!`,
      quiz: [
        {
          question: `Who was the main character of this story?`,
          options: { A: profile.name, B: "A Dragon", C: "A Mystery" },
          correct_answer: "A"
        },
        {
          question: `What kind of journey was it?`,
          options: { A: "A quiet one", B: "A grand journey", C: "A scary one" },
          correct_answer: "B"
        }
      ]
    };

    log('All AI providers exceeded limits or failed. Returning Magic Backup story.');
    return res.json({ story: fallbackStory });
  } catch (err) {
    error('generate-story error: ' + err.message);
    return res.json({ error: err.message || 'Unknown error' }, 500);
  }
};
