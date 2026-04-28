import { useApp } from '@/contexts/AppContext';
import { analytics } from '@/services/analyticsService';
import { profileService, quizService, storyService } from '@/services/database';
import { DEVICE_TTS_AUDIO_URL } from '@/services/deviceTTSService';
import {
  getLocationFromProfile,
  LocationContext,
} from '@/services/locationService';
import { templateStoryService } from '@/services/templateStoryService';
import { getCurrentContext } from '@/utils/contextUtils';
import { hapticFeedback } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import { preGeneratedStoryService } from '@/services/preGeneratedStoryService';
import { checkStorySafety, getFallbackStory } from '@/utils/storySafetyFilter';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GenerationPhase = 'options' | 'generating';
export interface GenerationStep {
  id: string;
  label: string;
  completed: boolean;
}

export function useStoryGeneration() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, subscription, refreshSubscription, refreshStories } =
    useApp();

  const [selectedBehaviorGoal, setSelectedBehaviorGoal] = useState<
    string | null
  >((params.behaviorGoal as string) || null);
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<
    'short' | 'medium' | 'long'
  >('short');
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    (params.languageCode as string) || 'en',
  );

  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(
    profile ? getLocationFromProfile(profile) : null,
  );

  const [phase, setPhase] = useState<GenerationPhase>('options');
  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'profile', label: 'Loading profile', completed: false },
    { id: 'story', label: 'Creating story', completed: false },
    { id: 'quiz', label: 'Generating quiz', completed: false },
    { id: 'audio', label: 'Adding narration', completed: false },
  ]);

  const isMountedRef = useRef(true);
  const resolvedProfileId = (params.profileId as string) || profile?.id;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (profile) setLocationCtx(getLocationFromProfile(profile));
  }, [profile]);

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: true } : s)),
    );
    hapticFeedback.light();
  }, []);
  const markError = useCallback((message: string) => {
    setError(message);
  }, []);

  const createQuizQuestions = useCallback(
    async (
      storyId: string,
      aiStory: {
        quiz: {
          question: string;
          options: { A: string; B: string; C: string };
          correct_answer: string;
        }[];
      },
    ) => {
      for (let i = 0; i < aiStory.quiz.length; i++) {
        const q = aiStory.quiz[i];
        const question = await quizService.createQuestion(
          storyId,
          q.question,
          i + 1,
        );
        if (!question) continue;
        await quizService.createAnswer(
          question.id,
          q.options.A,
          q.correct_answer === 'A',
          'A',
        );
        await quizService.createAnswer(
          question.id,
          q.options.B,
          q.correct_answer === 'B',
          'B',
        );
        await quizService.createAnswer(
          question.id,
          q.options.C,
          q.correct_answer === 'C',
          'C',
        );
      }
    },
    [],
  );

  const runGeneration = async () => {
    try {
      if (!resolvedProfileId) return markError('Profile not found.');
      setStatus('Loading your profile...');
      setProgress(10);
      const profileData =
        await profileService.getWithRelations(resolvedProfileId);
      if (!profileData) return markError('Profile not found.');
      if (!isMountedRef.current) return;
      completeStep('profile');

      const context = getCurrentContext();
      setStatus('Choosing a bedtime template...');
      setProgress(30);
      // ── TRY PRE-GENERATED TEMPLATE FIRST (zero cost) ──
      const familyNames = (profileData.family_members || []).map(
        (m: { name: string }) => m.name,
      );
      const friendNames = (profileData.friends || []).map(
        (f: { name: string }) => f.name,
      );

      let aiStory = await preGeneratedStoryService.getPreGeneratedStory(
        selectedTheme,
        selectedBehaviorGoal || 'confidence',
        selectedLanguage,
        profileData.kid_name,
        familyNames,
        friendNames,
        profileData.city,
        selectedMood,
      );

      // ── FALLBACK TO AI GENERATION IF NO TEMPLATE ──
      if (!aiStory) {
        aiStory = await templateStoryService.generateTemplateStory(
          profileData,
          selectedBehaviorGoal,
          selectedLanguage,
        );
      }

      if (!aiStory) return markError('Could not generate a story.');
      if (!isMountedRef.current) return;

      // ── AI Output Safety Filter ──────────────────────────────
      const safetyResult = checkStorySafety(aiStory.title, aiStory.content);
      if (!safetyResult.safe) {
        logger.warn(
          '[StoryGen] Safety filter blocked story, using fallback',
          safetyResult.flags,
        );
        const fallback = getFallbackStory();
        aiStory = {
          title: fallback.title,
          content: fallback.content,
          word_count: fallback.content.split(/\s+/).filter(Boolean).length,
          quiz: [
            {
              question: 'What was the story about?',
              options: {
                A: 'A magical adventure',
                B: 'A cooking recipe',
                C: 'A math lesson',
              },
              correct_answer: 'A' as const,
            },
            {
              question: 'How did the story end?',
              options: { A: 'Sadly', B: 'Happily', C: 'It did not end' },
              correct_answer: 'B' as const,
            },
            {
              question: 'What did the character learn?',
              options: {
                A: 'Nothing',
                B: 'Something negative',
                C: 'Something positive',
              },
              correct_answer: 'C' as const,
            },
          ],
        };
      }

      completeStep('story');
      setStatus('Creating quiz questions...');
      setProgress(50);

      const storyRecord = await storyService.create({
        profile_id: resolvedProfileId,
        language_code: selectedLanguage,
        title: aiStory.title,
        content: aiStory.content,
        audio_url: DEVICE_TTS_AUDIO_URL,
        season: context.season,
        time_of_day: context.timeOfDay,
        theme: selectedTheme,
        mood: selectedMood,
        word_count: aiStory.word_count || null,
        share_token: null,
        like_count: 0,
        generated_at: new Date().toISOString(),
        location_city: locationCtx?.city ?? null,
        location_country: locationCtx?.country ?? null,
        behavior_goal: selectedBehaviorGoal,
      });

      if (selectedBehaviorGoal)
        analytics.trackStoryGeneratedWithGoal(
          selectedBehaviorGoal,
          selectedLanguage,
          selectedVoice ?? null,
          selectedLength,
        );

      setProgress(70);
      await createQuizQuestions(storyRecord.id, aiStory);
      if (!isMountedRef.current) return;
      completeStep('quiz');
      setStatus('Finalising your story...');
      setProgress(90);

      completeStep('audio');

      setStatus('Story ready!');
      setProgress(100);
      hapticFeedback.success();
      await Promise.all([refreshSubscription(), refreshStories()]);
      if (isMountedRef.current)
        setTimeout(
          () =>
            router.replace({
              pathname: '/story/playback',
              params: { storyId: storyRecord.id },
            }),
          800,
        );
    } catch (err) {
      logger.error('[useStoryGeneration] Generation Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    }
  };

  const handleStartGeneration = () => {
    const isPro =
      subscription?.plan === 'pro' || subscription?.plan === 'family';
    if (
      !isPro &&
      subscription?.stories_remaining !== undefined &&
      subscription.stories_remaining <= 0
    ) {
      return router.push('/paywall');
    }
    setPhase('generating');
    runGeneration();
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setStatus('Preparing your adventure...');
    setSteps((prev) => prev.map((s) => ({ ...s, completed: false })));
    setPhase('options');
  };

  return {
    selectedBehaviorGoal,
    setSelectedBehaviorGoal,
    selectedTheme,
    setSelectedTheme,
    selectedMood,
    setSelectedMood,
    selectedLength,
    setSelectedLength,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    setSelectedLanguage,
    locationCtx,
    phase,
    status,
    progress,
    error,
    steps,
    handleStartGeneration,
    handleRetry,
    subscription,
  };
}
