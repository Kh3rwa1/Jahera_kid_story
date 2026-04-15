import { VOICE_PRESETS } from '@/constants/voicePresets';
import { useApp } from '@/contexts/AppContext';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { analytics } from '@/services/analyticsService';
import { generateAudio } from '@/services/audioService';
import { profileService, quizService, storyService } from '@/services/database';
import { getLocationFromProfile, LocationContext } from '@/services/locationService';
import { getCurrentContext } from '@/utils/contextUtils';
import { hapticFeedback } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GenerationPhase = 'options' | 'generating';
export interface GenerationStep { id: string; label: string; completed: boolean; }

export function useStoryGeneration() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, subscription, refreshSubscription, refreshStories } = useApp();

  const [selectedBehaviorGoal, setSelectedBehaviorGoal] = useState<string | null>((params.behaviorGoal as string) || null);
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState((params.languageCode as string) || 'en');


  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(profile ? getLocationFromProfile(profile) : null);

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

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
  useEffect(() => { if (profile) setLocationCtx(getLocationFromProfile(profile)); }, [profile]);



  const completeStep = useCallback((stepId: string) => { setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s)); hapticFeedback.light(); }, []);
  const markError = useCallback((message: string) => { setError(message); }, []);

  const buildAudioSettings = (profileData: any) => {
    const preset = VOICE_PRESETS.find(v => v.id === selectedVoice);
    return {
      voiceId: preset?.elevenLabsVoiceId ?? profileData.elevenlabs_voice_id,
      modelId: profileData.elevenlabs_model_id,
      stability: preset?.settings.stability ?? profileData.elevenlabs_stability,
      similarity: preset?.settings.similarity ?? profileData.elevenlabs_similarity,
      style: preset?.settings.style ?? profileData.elevenlabs_style,
      speakerBoost: preset?.settings.speakerBoost ?? profileData.elevenlabs_speaker_boost,
      gender: preset?.gender ?? null,
    };
  };

  const createQuizQuestions = useCallback(async (storyId: string, aiStory: any) => {
    for (let i = 0; i < aiStory.quiz.length; i++) {
      const q = aiStory.quiz[i];
      const question = await quizService.createQuestion(storyId, q.question, i + 1);
      if (!question) continue;
      await quizService.createAnswer(question.id, q.options.A, q.correct_answer === 'A', 'A');
      await quizService.createAnswer(question.id, q.options.B, q.correct_answer === 'B', 'B');
      await quizService.createAnswer(question.id, q.options.C, q.correct_answer === 'C', 'C');
    }
  }, []);

  const runGeneration = async () => {
    try {
      if (!resolvedProfileId) return markError('Profile not found.');
      setStatus('Loading your profile...'); setProgress(10);
      const profileData = await profileService.getWithRelations(resolvedProfileId);
      if (!profileData) return markError('Profile not found.');
      if (!isMountedRef.current) return;
      completeStep('profile');

      setStatus('Creating your adventure story...'); setProgress(30);
      const context = getCurrentContext();
      const preset = VOICE_PRESETS.find(v => v.id === selectedVoice) || null;
      const options: StoryOptions = {
        theme: selectedTheme, mood: selectedMood, length: selectedLength, locationContext: locationCtx,
        behaviorGoal: selectedBehaviorGoal ?? undefined,
        voicePreset: selectedVoice,
        voiceSettings: preset?.settings ?? null,
      };

      const aiStory = await generateAdventureStory(profileData, selectedLanguage, context, options);
      if (!aiStory) return markError('Could not generate a story.');

      if (!isMountedRef.current) return;
      completeStep('story'); setStatus('Creating quiz questions...'); setProgress(50);

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
        behavior_goal: selectedBehaviorGoal,
      });

      if (selectedBehaviorGoal) analytics.trackStoryGeneratedWithGoal(selectedBehaviorGoal, selectedLanguage, selectedVoice ?? null, selectedLength);

      setProgress(70);
      await createQuizQuestions(storyRecord.id, aiStory);
      if (!isMountedRef.current) return;
      completeStep('quiz'); setStatus('Finalising your story...'); setProgress(90);

      void generateAudio(aiStory.content, selectedLanguage, storyRecord.id, false, buildAudioSettings(profileData))
        .then((url) => { 
          if (isMountedRef.current) {
            if (url) {
              completeStep('audio'); 
            } else {
              // This is the "text story but not audio" case
              logger.warn('[useStoryGeneration] Audio generation returned null (likely timeout)');
              setError('Story is ready, but audio is still generating in the background. You can find it in your Library shortly.');
              // We still mark it as complete so they can view the text
              completeStep('audio');
            }
          } 
        })
        .catch(err => {
          logger.error('[useStoryGeneration] Audio error:', err);
          if (isMountedRef.current) {
            setError('Audio generation failed. You can still read the story!');
            completeStep('audio');
          }
        });

      setStatus('Story ready!'); setProgress(100); hapticFeedback.success();
      await Promise.all([refreshSubscription(), refreshStories()]);
      if (isMountedRef.current) setTimeout(() => router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.id } }), 800);
    } catch (err) {
      logger.error('[useStoryGeneration] Generation Failed:', err);
      if (err instanceof QuotaExceededError) { setIsQuotaError(true); setError(err.message); return; }
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    }
  };

  const handleStartGeneration = () => {
    const isPro = subscription?.plan !== 'free';
    if (selectedLength === 'long' && !isPro) return router.push('/paywall');
    setPhase('generating'); runGeneration();
  };

  const handleRetry = () => { setError(null); setIsQuotaError(false); setProgress(0); setStatus('Preparing your adventure...'); setSteps(prev => prev.map(s => ({ ...s, completed: false }))); setPhase('options'); };

  return {
    selectedBehaviorGoal, setSelectedBehaviorGoal,
    selectedTheme, setSelectedTheme,
    selectedMood, setSelectedMood,
    selectedLength, setSelectedLength,
    selectedVoice, setSelectedVoice,
    selectedLanguage, setSelectedLanguage,
    locationCtx,
    phase, status, progress, error, isQuotaError, steps,
    handleStartGeneration, handleRetry,
    subscription,
  };
}
