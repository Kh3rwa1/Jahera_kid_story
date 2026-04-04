import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { LocationContext } from '@/services/locationService';
import { functions } from '@/lib/appwrite';

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
    const payload = JSON.stringify({ profile, languageCode, context, options });
    const response = await functions.createExecution({
      functionId: 'generate-story',
      body: payload,
      async: false // Switch to synchronous for 100% reliable body delivery
    });

    if (response.status === 'failed' || (response.errors && response.errors.length > 0)) {
      throw new Error(`Story generation service execution error: ${response.errors || 'Execution failed'}`);
    }

    let data: any = {};
    try {
      // Direct access to the response body in synchronous mode
      data = JSON.parse(response.responseBody);
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
