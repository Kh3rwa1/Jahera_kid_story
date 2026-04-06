const https = require('https');
const url = require('url');
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
  funny: 'side-splittingly funny, full of playful slapstick, silly puns, and hilarious situations that will make a child giggle and laugh out loud',
  exciting: 'thrilling, high-energy, and full of cinematic action and suspense',
  calming: 'gentle, peaceful, and soothing — perfect for settling down',
  calm: 'gentle, peaceful, and soothing',
  mysterious: 'intriguing, curious, and full of gentle mystery to solve',
  educational: 'engagingly educational — teaching a fascinating fun fact in a story-driven way',
};

const LENGTH_CONFIGS = {
  short: { words: '200-280 words', tokens: 1200 }, // Slightly higher tokens for better endings
  medium: { words: '400-550 words', tokens: 2000 },
  long: { words: '700-950 words', tokens: 3200 },
};

const OPENROUTER_BASE = 'https://openrouter.ai';
const CLAUDE_BASE = 'https://api.anthropic.com';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const GEMINI_MODEL = 'gemini-2.0-flash';

async function fetchDynamicPrompt(databases, log) {
  try {
    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jahera_db';
    const response = await databases.listDocuments(
      DATABASE_ID,
      'config',
      [Query.equal('key', 'story_system_prompt'), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      log('Successfully fetched dynamic system prompt from database.');
      return response.documents[0].value;
    }
  } catch (err) {
    log('Could not fetch dynamic prompt (check if "config" collection exists): ' + err.message);
  }
  return null;
}

function buildPrompt(profile, languageCode, context, options, dynamicSystemPrompt) {
  const familyMembers = (profile.family_members || []);
  const friends = (profile.friends || []);
  const characterNames = [...familyMembers.map(m => m.name), ...friends.map(f => f.name)];
  
  const characterContext = characterNames.length > 0
    ? `You MUST include these specific characters as major, active participants in the adventure: ${characterNames.join(', ')}. They should have dialogue and play key roles in resolving the story hooks.`
    : '';

  const themeDesc = options?.theme ? (THEME_PROMPTS[options.theme] || options.theme) : 'an adventure';
  const moodDesc = options?.mood ? (MOOD_PROMPTS[options.mood] || options.mood) : 'engaging and fun';
  const lengthConfig = LENGTH_CONFIGS[options?.length || 'medium'];

  const loc = options?.locationContext;
  const locationParts = [loc?.city, loc?.country].filter(Boolean);
  const locationLine = locationParts.length > 0
    ? `- Location: Set the story in or around ${locationParts.join(', ')} — weave in local landmarks and cultural details to make it feel authentic and grounded.`
    : '';

  // Use dynamic prompt from DB or robust default
  const systemMessage = dynamicSystemPrompt || `You are a world-class award-winning creative children's storyteller. 
You write cinematic, age-appropriate adventures for children aged 4-10. 
CRITICAL TONE REQUIREMENTS:
- If Tone is "funny": The story MUST be genuinely humorous for a child. Use silly dialogue, funny misunderstandings, playful slapstick, and whimsical descriptions. The goal is to make them giggle at every turn.
- If Theme is "adventure": Ensure a strong sense of wonder, discovery, and high-stakes excitement (child-safe).
- Character Integrity: Family and friends are HUMANS. Never make them animals or objects. Give them distinct personalities.

Response format: Strictly JSON. No markdown, no fences.`;

  const userMessage = `Create a magical children's story for ${profile.kid_name}.

Story Configuration:
- Language: ${languageCode}
- Time/Season: ${context.timeOfDay} during ${context.season}
- Theme: ${themeDesc}
- Tone/Mood: ${moodDesc} (Master this tone. If funny, be hilarious. If exciting, be thrilling.)
- Target Content Length: ${lengthConfig.words}
- Primary Character: ${profile.kid_name} (Age 4-10)
- Supporting Cast: ${characterNames.length > 0 ? characterNames.join(', ') : 'None'} (Include them as active partners in the journey!)
${locationLine}
${characterContext}

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
  if (!story.title || typeof story.title !== 'string') throw new Error('Missing story title');
  if (!story.content || typeof story.content !== 'string') throw new Error('Missing story content');
  
  const validQuiz = (story.quiz || []).slice(0, 3).filter(q =>
    q.question && q.options?.A && q.options?.B && q.options?.C && q.correct_answer
  );
  
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
      return res.json({ error: 'Missing required fields' }, 400);
    }

    // Initialize Appwrite for dynamic config
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY);
    
    const databases = new Databases(client);
    const dynamicPrompt = await fetchDynamicPrompt(databases, log);

    const { systemMessage, userMessage, tokens } = buildPrompt(profile, languageCode, context, options, dynamicPrompt);

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
        isOpenRouter: true 
      });
    } else {
      log('⚠️ OPENROUTER_API_KEY is missing');
    }
    
    
    if (claudeKey) {
      providers.push({ id: 'claude', baseUrl: CLAUDE_BASE, path: '/v1/messages', apiKey: claudeKey, model: CLAUDE_MODEL, isClaude: true });
    } else {
      log('⚠️ CLAUDE_API_KEY is missing');
    }

    if (geminiKey) {
      providers.push({ id: 'gemini', baseUrl: GEMINI_BASE, path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, apiKey: geminiKey, model: GEMINI_MODEL, isGemini: true });
    } else {
      log('⚠️ GEMINI_API_KEY is missing');
    }

    // Fallback Safety Net (always present)
    providers.push({ id: 'pollinations', baseUrl: 'https://text.pollinations.ai', path: '/', model: 'openai', isPollinations: true });

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
          const result = await httpsPost(provider.baseUrl, provider.path, reqHeaders, {
            model: provider.model,
            system: systemMessage,
            messages: [{ role: 'user', content: userMessage }],
            max_tokens: tokens,
            temperature: 0.85,
          });
          status = result.status; responseText = result.body;
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
              providerErrors.push(`${provider.id} parse error: ${responseText.slice(0, 100)}`);
            }
          } else {
            error(`❌ ${provider.id} failed (${status}): ${responseText}`);
            if (responseText.includes('unauthorized_client_error') || responseText.includes('unauthenticated')) {
              error(`⚠️ CRITICAL: ${provider.id} API key is invalid or blocked.`);
            }
            providerErrors.push(`${provider.id} error (${status}): ${responseText || 'No body'}`);
          }
        } else if (provider.isPollinations) {
          const pollUrl = `${provider.baseUrl}/${encodeURIComponent(systemMessage + '\n\n' + userMessage)}`;
          const result = await new Promise((resolve, reject) => {
            https.get(pollUrl, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }).on('error', reject);
          });
          if (result.status === 200) {
            log(`Success via ${provider.id}`);
            successfulStory = parseStoryJson(result.body);
            break;
          } else {
            providerErrors.push(`${provider.id} error (${result.status}): ${result.body || 'No body'}`);
          }
        } else if (provider.isGemini) {
          const result = await httpsPost(provider.baseUrl, provider.path, {}, {
            contents: [{ role: 'user', parts: [{ text: `${systemMessage}\n\n${userMessage}` }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: tokens, responseMimeType: 'application/json' }
          });
          if (result.status === 200) {
            const data = JSON.parse(result.body);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              log(`Success via ${provider.id}`);
              successfulStory = parseStoryJson(content);
              break;
            }
          } else {
            providerErrors.push(`${provider.id} error (${result.status}): ${result.body || 'No body'}`);
          }
        } else {
          // OpenRouter
          const result = await httpsPost(provider.baseUrl, provider.path, reqHeaders, {
            model: provider.model,
            messages: [
              { role: 'system', content: systemMessage }, 
              { role: 'user', content: userMessage }
            ],
            temperature: 0.85, 
            max_tokens: tokens,
          });
          
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
              providerErrors.push(`${provider.id} parse error: ${result.body.slice(0, 100)}`);
            }
          } else {
            error(`❌ ${provider.id} failed (${result.status}): ${result.body}`);
            if (result.body.includes('unauthorized_client_error') || result.body.includes('unauthenticated')) {
              error(`⚠️ CRITICAL: ${provider.id} API key is invalid or blocked.`);
            }
            providerErrors.push(`${provider.id} error (${result.status}): ${result.body || 'No body'}`);
          }
        }
      } catch (err) {
        log(`Provider ${provider.id} exception: ${err.message}`);
        providerErrors.push(`${provider.id} failed: ${err.message}`);
      }
    }

    if (successfulStory) return res.json({ story: successfulStory });

    error('All providers failed:\n' + providerErrors.join('\n'));

    // Final fallback
    return res.json({ 
      story: {
        title: `${profile.kid_name}'s Magical Discovery`,
        content: `Once upon a time, ${profile.kid_name} went on a grand adventure in ${context.season}. Together with ${profile.family_members?.[0]?.name || 'family'} and ${profile.friends?.[0]?.name || 'friends'}, they discovered that the true magic was in the friendship they shared.`,
        quiz: []
      } 
    });

  } catch (err) {
    error('generate-story critical error: ' + err.message);
    return res.json({ error: err.message }, 500);
  }
};
