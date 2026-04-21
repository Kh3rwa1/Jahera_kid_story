import { functions } from '@/lib/appwrite';
import { LocationContext } from '@/services/locationService';
import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { sanitizeCity, sanitizeName } from '@/utils/promptSanitizer';
import { checkStorySafety, getFallbackStory } from '@/utils/storySafetyFilter';
import { analytics } from '@/services/analyticsService';

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
  behaviorGoal?: string;
  voicePreset?: string | null;
  voiceSettings?: {
    stability: number;
    similarity: number;
    style: number;
    speakerBoost: boolean;
  } | null;
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
  options?: StoryOptions,
): Promise<GeneratedStory | null> {
  try {
    const sanitizedProfile = {
      ...profile,
      kid_name: sanitizeName(profile.kid_name || ''),
      city: sanitizeCity(profile.city || ''),
      family_members: [],
      friends: [],
    };

    const originalKidName = profile.kid_name || '';
    if (sanitizedProfile.kid_name.length !== originalKidName.length) {
      analytics.track('prompt_sanitized', {
        field: 'kid_name',
        originalLength: originalKidName.length,
        sanitizedLength: sanitizedProfile.kid_name.length,
        hadUnsafeContent: sanitizedProfile.kid_name !== originalKidName.trim(),
      });
    }

    const payload = JSON.stringify({
      profile: sanitizedProfile,
      languageCode,
      context,
      options,
    });
    const response = await functions.createExecution({
      functionId: 'generate-story',
      body: payload,
      async: false, // Switch to synchronous for 100% reliable body delivery
    });

    if (
      response.status === 'failed' ||
      (response.errors && response.errors.length > 0)
    ) {
      throw new Error(
        `Story generation service execution error: ${response.errors || 'Execution failed'}`,
      );
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

    if (!data.story)
      throw new Error('No story returned from generation service');

    const story = data.story as GeneratedStory;
    const wordCount = story.content.split(/\s+/).filter(Boolean).length;

    // ── AI Output Safety Filter ──────────────────────────────────
    const safetyResult = checkStorySafety(story.title, story.content);
    if (!safetyResult.safe) {
      analytics.track('story_safety_blocked', {
        score: safetyResult.score,
        flags: safetyResult.flags,
        title: story.title,
      });

      // Retry with stricter prompt
      const retryPayload = JSON.stringify({
        profile: { ...profile, kid_name: sanitizeName(profile.kid_name || '') },
        languageCode,
        context,
        options: {
          ...options,
          mood: 'calming',
          theme: options?.theme || 'nature',
        },
      });
      const retryResponse = await functions.createExecution({
        functionId: 'generate-story',
        body: retryPayload,
        async: false,
      });

      let retryData: any = {};
      try {
        retryData = JSON.parse(retryResponse.responseBody);
      } catch {}

      if (retryData?.story) {
        const retryStory = retryData.story as GeneratedStory;
        const retrySafety = checkStorySafety(
          retryStory.title,
          retryStory.content,
        );
        if (retrySafety.safe) {
          const retryWordCount = retryStory.content
            .split(/\s+/)
            .filter(Boolean).length;
          return { ...retryStory, word_count: retryWordCount };
        }
      }

      // Both attempts failed — use pre-approved fallback
      analytics.track('story_safety_fallback_used', {
        originalTitle: story.title,
      });
      const fallback = getFallbackStory();
      return {
        title: fallback.title,
        content: fallback.content,
        word_count: fallback.content.split(/\s+/).filter(Boolean).length,
        quiz: [],
      };
    }

    return { ...story, word_count: wordCount };
  } catch (error) {
    if (error instanceof QuotaExceededError || error instanceof Error)
      throw error;
    return null;
  }
}
