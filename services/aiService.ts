import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite';
import { LocationContext } from '@/services/locationService';

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
  locationContext?: LocationContext | null;
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

export async function generateAdventureStory(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext,
  options?: StoryOptions
): Promise<GeneratedStory | null> {
  try {
    const functionUrl = `${APPWRITE_ENDPOINT}/functions/generate-story/executions`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
      body: JSON.stringify({
        async: false,
        body: JSON.stringify({ profile, languageCode, context, options }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Story generation service error: ${response.status}`);
    }

    const execution = await response.json();
    const responseBody = execution.responseBody || execution.response || '';

    let data: any = {};
    try {
      data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    } catch {
      throw new Error('Invalid response from story generation service');
    }

    if (data.error) {
      if (data.quotaExceeded) throw new QuotaExceededError(data.error);
      throw new Error(data.error);
    }

    if (!data.story) throw new Error('No story returned from generation service');

    const story = data.story as GeneratedStory;
    const wordCount = story.content.split(/\s+/).filter(Boolean).length;
    return { ...story, word_count: wordCount };
  } catch (error) {
    if (error instanceof QuotaExceededError || error instanceof Error) throw error;
    return null;
  }
}
