import { useAudio } from '@/contexts/AudioContext';
import { useApp } from '@/contexts/AppContext';
import { quizService, storyService } from '@/services/database';
import { Story } from '@/types/database';
import { logger } from '@/utils/logger';
import { personalizeStory } from '@/utils/nameSubstitution';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

export type TabMode = 'audio' | 'text';

export function usePlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loadAndPlayAudio, pauseAudio, stopAudio, retryAudio } = useAudio();
  const hasLoadedRef = useRef<string | null>(null);
  const { profile } = useApp();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [tab, setTab] = useState<TabMode>('audio');
  const [showCinematicIntro, setShowCinematicIntro] = useState(true);

  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introOpacity = useSharedValue(1);

  const loadStory = useCallback(async () => {
    try {
      const storyId = params.storyId as string;
      if (!storyId) {
        setIsLoading(false);
        setShowCinematicIntro(false);
        return;
      }

      const storyData = await storyService.getById(storyId);
      if (!storyData) {
        setIsLoading(false);
        setShowCinematicIntro(false);
        return;
      }

      // Personalize story with current user's kid name
      const personalized = profile
        ? personalizeStory(storyData, profile.kid_name, profile.city)
        : storyData;

      setStory(personalized);

      const quizData = await quizService.getQuestionsByStoryId(storyId);
      setHasQuiz(!!quizData && quizData.length > 0);

      // Start audio generation/play with personalized content
      // Only load once per story ID - prevents re-render loop
      if (hasLoadedRef.current !== (params.storyId as string)) {
        hasLoadedRef.current = params.storyId as string;
        loadAndPlayAudio(personalized);
      }

      setIsLoading(false);

      // Minimum duration for the cinematic intro
      introTimerRef.current = setTimeout(() => {
        dismissCinematicIntro();
      }, 5000);
    } catch (err) {
      logger.error('[usePlayback] Failed to load story:', err);
      setIsLoading(false);
      setShowCinematicIntro(false);
    }
  }, [params.storyId, profile]); // removed loadAndPlayAudio - causes infinite re-render loop

  const dismissCinematicIntro = useCallback(() => {
    if (introTimerRef.current) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    introOpacity.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    setTimeout(() => setShowCinematicIntro(false), 600);
  }, [introOpacity]);

  useEffect(() => {
    loadStory();
    return () => {
      hasLoadedRef.current = null;
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [loadStory]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoToQuiz = useCallback(() => {
    if (!story) return;
    pauseAudio();
    router.push({ pathname: '/story/quiz', params: { storyId: story.id } });
  }, [pauseAudio, story, router]);

  const handleNewStory = useCallback(() => {
    if (!story) return;
    stopAudio();
    router.push({
      pathname: '/story/generate',
      params: {
        profileId: story.profile_id,
        languageCode: story.language_code,
      },
    });
  }, [stopAudio, story, router]);

  return {
    story,
    isLoading,
    hasQuiz,
    tab,
    setTab,
    showCinematicIntro,
    introOpacity,
    dismissCinematicIntro,
    handleBack,
    handleGoToQuiz,
    handleNewStory,
    retryAudio,
  };
}
