import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { supabase } from '@/lib/supabase';

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
  quiz: QuizQuestion[];
}

export async function generateAdventureStory(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext
): Promise<GeneratedStory | null> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/generate-story`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || supabaseAnonKey;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        profileId: profile.id,
        languageCode,
        context,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Story generation error:', errorData);
      throw new Error(errorData.error || 'Failed to generate story');
    }

    const data = await response.json();

    if (!data.success || !data.story) {
      throw new Error('Invalid response from story generation');
    }

    const story = data.story;

    if (!story.title || !story.content || !story.quiz || !Array.isArray(story.quiz) || story.quiz.length !== 3) {
      throw new Error('Invalid story format - missing title, content, or quiz');
    }

    return story;
  } catch (error) {
    console.error('Error generating story:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Story generation timed out. Please try again.');
    }
    if (error instanceof Error) {
      throw error;
    }
    return null;
  }
}
