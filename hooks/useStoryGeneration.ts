import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { profileService, storyService, quizService, familyMemberService, friendService } from '@/services/database';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { getLocationContext, LocationContext } from '@/services/locationService';
import { useApp } from '@/contexts/AppContext';
import { hapticFeedback } from '@/utils/haptics';
import { FamilyMember, Friend, Story } from '@/types/database';
import { logger } from '@/utils/logger';

export type GenerationPhase = 'options' | 'generating';

export interface GenerationStep {
  id: string;
  label: string;
  completed: boolean;
}

export function useStoryGeneration() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, subscription, refreshSubscription, refreshStories } = useApp();

  // Form State
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');
  const [selectedLanguage, setSelectedLanguage] = useState((params.languageCode as string) || 'en');
  
  // Relations
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Generation State
  const [phase, setPhase] = useState<GenerationPhase>('options');
  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
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
    return () => { isMountedRef.current = false; };
  }, []);

  // Initialization
  useEffect(() => {
    if (!resolvedProfileId) return;

    Promise.all([
      familyMemberService.getByProfileId(resolvedProfileId),
      friendService.getByProfileId(resolvedProfileId),
    ]).then(([fm, fr]) => {
      if (isMountedRef.current) {
        if (fm) setFamilyMembers(fm);
        if (fr) setFriends(fr);
      }
    });

    setLocationLoading(true);
    getLocationContext().then(ctx => {
      if (isMountedRef.current) {
        setLocationCtx(ctx);
        setLocationLoading(false);
      }
    });
  }, [resolvedProfileId]);

  const completeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
    hapticFeedback.light();
  }, []);

  const runGeneration = async () => {
    try {
      if (!resolvedProfileId) {
        setError('Profile not found.');
        return;
      }

      setStatus('Loading your profile...');
      setProgress(10);

      const profileData = await profileService.getWithRelations(resolvedProfileId);
      if (!profileData) {
        setError('Profile not found.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('profile');
      setStatus('Creating your adventure story...');
      setProgress(30);

      const context = getCurrentContext();
      const options: StoryOptions = {
        theme: selectedTheme,
        mood: selectedMood,
        length: selectedLength,
        locationContext: locationCtx,
      };

      const aiStory = await generateAdventureStory(profileData, selectedLanguage, context, options);
      if (!aiStory) {
        setError('Could not generate a story.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('story');
      setStatus('Creating quiz questions...');
      setProgress(50);

      const storyRecord = await storyService.create({
        profile_id: resolvedProfileId,
        language_code: selectedLanguage,
        title: aiStory.title,
        content: aiStory.content,
        audio_url: null,
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
      });

      if (!storyRecord) {
        setError('Failed to save story.');
        return;
      }

      setProgress(70);

      let quizCreatedCount = 0;
      for (let i = 0; i < aiStory.quiz.length; i++) {
        const q = aiStory.quiz[i];
        const question = await quizService.createQuestion(storyRecord.id, q.question, i + 1);
        if (question) {
          await quizService.createAnswer(question.id, q.options.A, q.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.id, q.options.B, q.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.id, q.options.C, q.correct_answer === 'C', 'C');
          quizCreatedCount++;
        }
      }

      if (!isMountedRef.current) return;
      completeStep('quiz');
      setStatus('Finalising your story...');
      setProgress(90);

      const audioSettings = profileData ? {
        voiceId: profileData.elevenlabs_voice_id,
        modelId: profileData.elevenlabs_model_id,
        stability: profileData.elevenlabs_stability,
        similarity: profileData.elevenlabs_similarity,
        style: profileData.elevenlabs_style,
        speakerBoost: profileData.elevenlabs_speaker_boost,
      } : undefined;

      generateAudio(aiStory.content, selectedLanguage, storyRecord.id, false, audioSettings)
        .then(() => { if (isMountedRef.current) completeStep('audio'); })
        .catch(err => logger.error('[useStoryGeneration] Audio error:', err));

      setStatus('Story ready!');
      setProgress(100);
      hapticFeedback.success();
      
      await Promise.all([refreshSubscription(), refreshStories()]);

      if (isMountedRef.current) {
        setTimeout(() => {
          router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.id } });
        }, 800);
      }
    } catch (err) {
      logger.error('[useStoryGeneration] Generation Failed:', err);
      if (err instanceof QuotaExceededError) {
        setIsQuotaError(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate story');
      }
    }
  };

  const handleStartGeneration = () => {
    const isPro = subscription?.plan !== 'free';
    if (selectedLength === 'long' && !isPro) {
      router.push('/paywall');
      return;
    }
    setPhase('generating');
    runGeneration();
  };

  const handleRetry = () => {
    setError(null);
    setIsQuotaError(false);
    setProgress(0);
    setStatus('Preparing your adventure...');
    setSteps(prev => prev.map(s => ({ ...s, completed: false })));
    setPhase('options');
  };

  return {
    selectedTheme, setSelectedTheme,
    selectedMood, setSelectedMood,
    selectedLength, setSelectedLength,
    selectedLanguage, setSelectedLanguage,
    familyMembers, setFamilyMembers,
    friends, setFriends,
    locationCtx, locationLoading,
    phase, status, progress, error, isQuotaError, steps,
    handleStartGeneration, handleRetry,
    subscription
  };
}
