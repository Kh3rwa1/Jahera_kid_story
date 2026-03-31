import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { LocationContext } from '@/services/locationService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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
    const functionUrl = `${SUPABASE_URL}/functions/v1/generate-story`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ profile, languageCode, context, options }),
    });

    if (!response.ok) {
      throw new Error(`Story generation service error: ${response.status}`);
    }

    let data: any = {};
    try {
      data = await response.json();
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
