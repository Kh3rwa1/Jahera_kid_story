import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { apiKeysService, ApiProvider } from '@/services/apiKeysService';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export interface StoryOptions {
  theme?: string;
  mood?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correct_answer: 'A' | 'B' | 'C';
}

export interface GeneratedStory {
  title: string;
  content: string;
  word_count?: number;
  quiz: QuizQuestion[];
}

const THEME_PROMPTS: Record<string, string> = {
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

const MOOD_PROMPTS: Record<string, string> = {
  funny: 'funny, playful, and full of silly humour',
  exciting: 'exciting, fast-paced, and full of action',
  calming: 'calm, peaceful, and soothing',
  calm: 'calm, peaceful, and soothing',
  mysterious: 'mysterious and intriguing',
  educational: 'educational and informative — teaching a fun fact',
};

const LENGTH_CONFIGS: Record<string, { words: string; tokens: number }> = {
  short: { words: '200-280 words', tokens: 1100 },
  medium: { words: '350-500 words', tokens: 1800 },
  long: { words: '600-800 words', tokens: 2800 },
};

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';
const OPENAI_MODEL = 'gpt-4o-mini';

async function callChatCompletion(
  apiKey: string,
  provider: ApiProvider,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  signal: AbortSignal
): Promise<string> {
  const isOpenRouter = provider === 'openrouter';
  const baseUrl = isOpenRouter ? OPENROUTER_BASE : OPENAI_BASE;
  const model = isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://jahera.app';
    headers['X-Title'] = 'Jahera Kids Stories';
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.85,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const errorMsg = errorData?.error?.message || `API error: ${response.status}`;

    if (response.status === 429) {
      throw new QuotaExceededError('You have reached your API usage limit. Please check your plan or try again later.');
    }
    if (response.status === 401) {
      throw new Error(`Invalid API key. Please check your ${isOpenRouter ? 'OpenRouter' : 'OpenAI'} key in Settings → API Keys.`);
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI provider');
  return content;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof QuotaExceededError) throw err;
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Invalid API key'))) throw err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

function buildPrompt(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext,
  options?: StoryOptions
): { systemMessage: string; userMessage: string; lengthTokens: number } {
  const characterNames = [
    ...profile.family_members.map(m => m.name),
    ...profile.friends.map(f => f.name),
  ];
  const characterContext = characterNames.length > 0
    ? `Include these characters: ${characterNames.join(', ')}.`
    : '';

  const themeDesc = options?.theme ? THEME_PROMPTS[options.theme] || options.theme : 'an adventure';
  const moodDesc = options?.mood ? MOOD_PROMPTS[options.mood] || options.mood : 'engaging and fun';
  const lengthConfig = LENGTH_CONFIGS[options?.length || 'medium'];

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

  return { systemMessage, userMessage, lengthTokens: lengthConfig.tokens };
}

function parseStoryJson(raw: string): GeneratedStory {
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

  const validQuiz = story.quiz.slice(0, 3).filter((q: any) =>
    q.question && q.options?.A && q.options?.B && q.options?.C && q.correct_answer
  );
  if (validQuiz.length < 2) throw new Error('Quiz questions are malformed');

  return { ...story, quiz: validQuiz } as GeneratedStory;
}

export async function generateAdventureStory(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext,
  options?: StoryOptions
): Promise<GeneratedStory | null> {
  try {
    const activeKey = await apiKeysService.getActiveAIKey();
    if (!activeKey) {
      throw new Error('No AI API key configured. Please add your OpenRouter or OpenAI key in Settings → API Keys.');
    }

    const { systemMessage, userMessage, lengthTokens } = buildPrompt(profile, languageCode, context, options);
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const rawContent = await withRetry(() =>
        callChatCompletion(activeKey.key, activeKey.provider, messages, lengthTokens, controller.signal)
      );
      clearTimeout(timeoutId);
      const story = parseStoryJson(rawContent);
      const wordCount = story.content.split(/\s+/).filter(Boolean).length;
      return { ...story, word_count: wordCount };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Story generation timed out. Please check your connection and try again.');
    }
    if (error instanceof QuotaExceededError || error instanceof Error) {
      throw error;
    }
    return null;
  }
}

