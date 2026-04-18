import { VOICE_PRESETS } from '@/constants/voicePresets';
import { useApp } from '@/contexts/AppContext';
// import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService'; // removed dead code
import { analytics } from '@/services/analyticsService';
// import { generateAudio } from '@/services/audioService'; // removed dead code
import { familyMemberService, friendService, profileService, quizService, storyService } from '@/services/database';
import { DEVICE_TTS_AUDIO_URL } from '@/services/deviceTTSService';
import { getLocationFromProfile, LocationContext } from '@/services/locationService';
import { templateStoryService } from '@/services/templateStoryService';
import { FamilyMember, Friend } from '@/types/database';
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

      const context = getCurrentContext();
      // Always generate a template story regardless of subscription plan
      const isFreeTemplateStory = true;
      setStatus('Choosing a bedtime template...');
      setProgress(30);
      const aiStory = await templateStoryService.generateTemplateStory(profileData, selectedBehaviorGoal, selectedLanguage);

      if (!aiStory) return markError('Could not generate a story.');

      if (!isMountedRef.current) return;
      completeStep('story'); setStatus('Creating quiz questions...'); setProgress(50);

      const storyRecord = await storyService.create({
        profile_id: resolvedProfileId,
        language_code: selectedLanguage,
        title: aiStory.title,
        content: aiStory.content,
        audio_url: isFreeTemplateStory ? DEVICE_TTS_AUDIO_URL : null,
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

      completeStep('audio'); // Audio generation removed; always use TTS template audio

      setStatus('Story ready!'); setProgress(100); hapticFeedback.success();
      await Promise.all([refreshSubscription(), refreshStories()]);
      if (isMountedRef.current) setTimeout(() => router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.id } }), 800);
    } catch (err) {
      logger.error('[useStoryGeneration] Generation Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    }
  };

  const handleStartGeneration = () => {
    // Free users: check story limit
    const isPro = subscription?.plan === 'pro' || subscription?.plan === 'family';
    if (!isPro && subscription?.stories_remaining !== undefined && subscription.stories_remaining <= 0) {
      return router.push('/paywall');
    }
    setPhase('generating');
    runGeneration();
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
