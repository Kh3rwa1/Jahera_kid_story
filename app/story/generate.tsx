import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { profileService, storyService, quizService } from '@/services/database';
import { generateAdventureStory } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { ProfileWithRelations } from '@/types/database';
import { Sparkles, AlertCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';

export default function GenerateStory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateStory();
  }, []);

  const generateStory = async () => {
    try {
      const profileId = params.profileId as string;
      const languageCode = params.languageCode as string;

      setStatus('Loading your profile...');
      setProgress(20);

      const profile = await profileService.getWithRelations(profileId);
      if (!profile) {
        router.back();
        return;
      }

      setStatus('Creating your adventure story...');
      setProgress(40);

      const context = getCurrentContext();
      const story = await generateAdventureStory(profile, languageCode, context);

      if (!story) {
        router.back();
        return;
      }

      setStatus('Generating audio narration...');
      setProgress(60);

      const storyRecord = await storyService.create({
        profile_id: profileId,
        language_code: languageCode,
        title: story.title,
        content: story.content,
        audio_url: null,
        season: context.season,
        time_of_day: context.timeOfDay,
        generated_at: new Date().toISOString(),
      });

      if (!storyRecord) {
        router.back();
        return;
      }

      setStatus('Creating quiz questions...');
      setProgress(70);

      for (let i = 0; i < story.quiz.length; i++) {
        const quizQuestion = story.quiz[i];
        const question = await quizService.createQuestion(
          storyRecord.id,
          quizQuestion.question,
          i + 1
        );

        if (question) {
          await quizService.createAnswer(question.id, quizQuestion.options.A, quizQuestion.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.id, quizQuestion.options.B, quizQuestion.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.id, quizQuestion.options.C, quizQuestion.correct_answer === 'C', 'C');
        }
      }

      setStatus('Generating audio narration...');
      setProgress(85);

      const audioPath = await generateAudio(story.content, languageCode, storyRecord.id);

      if (audioPath) {
        await storyService.update(storyRecord.id, { audio_url: audioPath });
      }

      setStatus('Story ready!');
      setProgress(100);

      setTimeout(() => {
        router.replace({
          pathname: '/story/playback',
          params: {
            storyId: storyRecord.id,
          },
        });
      }, 500);
    } catch (error) {
      console.error('Error generating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate story';

      if (errorMessage.includes('API key not configured')) {
        setError('Please add your OpenAI API key in Profile → Manage API Keys');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setStatus('Preparing your adventure...');
    generateStory();
  };

  const handleGoBack = () => {
    router.back();
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFE5E5' }]}>
            <AlertCircle size={60} color={COLORS.error} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Generation Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Sparkles size={60} color="#0d6efd" strokeWidth={2} />
        </View>

        <Text style={styles.title}>Generating Story</Text>
        <Text style={styles.status}>{status}</Text>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <ActivityIndicator size="large" color="#0d6efd" style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e7f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    maxWidth: 300,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  backButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 16,
  },
  backButtonText: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
  },
  loader: {
    marginTop: 16,
  },
});
