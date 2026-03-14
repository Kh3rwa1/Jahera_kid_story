import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { apiKeysService } from '@/services/apiKeysService';

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
  adventure: 'an exciting adventure',
  magic: 'a magical world with spells and wonder',
  animals: 'animals as the main characters',
  space: 'outer space and stars',
  ocean: 'the ocean and sea creatures',
  forest: 'an enchanted forest',
  dinosaurs: 'dinosaurs and prehistoric times',
  superheroes: 'superheroes and special powers',
};

const MOOD_PROMPTS: Record<string, string> = {
  funny: 'funny and full of humor',
  exciting: 'exciting and full of action',
  calm: 'calm and soothing',
  mysterious: 'mysterious and intriguing',
};

const LENGTH_CONFIGS: Record<string, { words: string; tokens: number }> = {
  short: { words: '100-150 words', tokens: 600 },
  medium: { words: '200-300 words', tokens: 1000 },
  long: { words: '400-500 words', tokens: 1600 },
};

export async function generateAdventureStory(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext,
  options?: StoryOptions
): Promise<GeneratedStory | null> {
  try {
    const openaiKey = await apiKeysService.getOpenAIKey();
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in Settings → API Keys.');
    }

    const characterNames = [
      ...profile.family_members.map(m => m.name),
      ...profile.friends.map(f => f.name),
    ];

    const characterContext = characterNames.length > 0
      ? `The story should include these characters: ${characterNames.join(', ')}.`
      : '';

    const themeDesc = options?.theme ? THEME_PROMPTS[options.theme] || options.theme : 'an adventure';
    const moodDesc = options?.mood ? MOOD_PROMPTS[options.mood] || options.mood : 'engaging';
    const lengthConfig = LENGTH_CONFIGS[options?.length || 'medium'];

    const prompt = `Create a children's story for a child named ${profile.kid_name}.
The story should be in ${languageCode} language.
The story is set during ${context.season} and it is ${context.timeOfDay}.
Theme: ${themeDesc}. Tone: ${moodDesc}.
${characterContext}
The story should be ${lengthConfig.words} long, educational, and appropriate for children aged 4-10.

Return ONLY a JSON object with this exact structure:
{
  "title": "Story Title",
  "content": "The full story text (150-250 words)",
  "quiz": [
    {
      "question": "Question text?",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "A"
    },
    {
      "question": "Question text?",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "B"
    },
    {
      "question": "Question text?",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "C"
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative children\'s story writer. Always respond with valid JSON only, no markdown, no extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: lengthConfig.tokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const story = JSON.parse(content);

    if (!story.title || !story.content || !Array.isArray(story.quiz) || story.quiz.length !== 3) {
      throw new Error('Invalid story format received from OpenAI');
    }

    const wordCount = story.content.split(/\s+/).filter(Boolean).length;
    return { ...story, word_count: wordCount } as GeneratedStory;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Story generation timed out. Please try again.');
    }
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
}
