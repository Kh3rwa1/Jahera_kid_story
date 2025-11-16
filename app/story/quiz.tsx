import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storyService, quizService } from '@/services/database';
import { Story, QuizQuestionWithAnswers } from '@/types/database';
import { Volume2, CheckCircle2, XCircle, Sparkles } from 'lucide-react-native';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const storyId = params.storyId as string;
      const storyData = await storyService.getById(storyId);
      const quizData = await quizService.getQuestionsByStoryId(storyId);

      if (!storyData || !quizData) {
        router.back();
        return;
      }

      setStory(storyData);
      setQuestions(quizData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      router.back();
    }
  };

  const handleAnswerSelect = (answerOrder: string) => {
    if (selectedAnswer !== null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.answers.find(a => a.is_correct);

    setSelectedAnswer(answerOrder);
    const correct = answerOrder === correctAnswer?.answer_order;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      const profileId = await AsyncStorage.getItem('profileId');
      if (profileId && story) {
        await quizService.createAttempt(profileId, story.id, score, questions.length);
      }
      setShowResult(true);
    }
  };

  const handleFinish = () => {
    router.push('/(tabs)/history');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!story || questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No quiz available</Text>
      </View>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <View style={styles.sparkleIcon}>
              <Sparkles size={60} color="#FFD93D" strokeWidth={2} />
            </View>
            <Text style={styles.resultTitle}>Amazing Job!</Text>
            <Text style={styles.resultSubtitle}>You completed the quiz!</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>
              {score} / {questions.length}
            </Text>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>{percentage}%</Text>
            </View>
          </View>

          <View style={styles.encouragement}>
            {percentage === 100 && (
              <>
                <Text style={styles.encouragementText}>🌟 Perfect Score! 🌟</Text>
                <Text style={styles.encouragementSubtext}>You're a super star!</Text>
              </>
            )}
            {percentage >= 66 && percentage < 100 && (
              <>
                <Text style={styles.encouragementText}>🎉 Great Work! 🎉</Text>
                <Text style={styles.encouragementSubtext}>Keep it up!</Text>
              </>
            )}
            {percentage < 66 && (
              <>
                <Text style={styles.encouragementText}>👍 Good Try! 👍</Text>
                <Text style={styles.encouragementSubtext}>Practice makes perfect!</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={styles.finishButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContainer}>
        <View style={styles.storyPreview}>
          <Text style={styles.storyTitle}>{story.title}</Text>
        </View>

        <View style={styles.questionCard}>
          <TouchableOpacity style={styles.speakerButton} activeOpacity={0.7}>
            <Volume2 size={24} color="#6C63FF" />
          </TouchableOpacity>

          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

          <View style={styles.answersContainer}>
            {currentQuestion.answers.map(answer => {
              const isSelected = selectedAnswer === answer.answer_order;
              const showCorrect = selectedAnswer !== null && answer.is_correct;
              const showWrong = isSelected && !answer.is_correct;

              return (
                <TouchableOpacity
                  key={answer.id}
                  style={[
                    styles.answerButton,
                    isSelected && styles.answerButtonSelected,
                    showCorrect && styles.answerButtonCorrect,
                    showWrong && styles.answerButtonWrong,
                  ]}
                  onPress={() => handleAnswerSelect(answer.answer_order)}
                  activeOpacity={0.7}
                  disabled={selectedAnswer !== null}>
                  <View style={styles.answerContent}>
                    <View
                      style={[
                        styles.answerLetter,
                        answer.answer_order === 'A' && styles.answerLetterA,
                        answer.answer_order === 'B' && styles.answerLetterB,
                        answer.answer_order === 'C' && styles.answerLetterC,
                      ]}>
                      <Text style={styles.answerLetterText}>{answer.answer_order}</Text>
                    </View>
                    <Text style={styles.answerText}>{answer.answer_text}</Text>
                    {showCorrect && <CheckCircle2 size={28} color="#4CAF50" />}
                    {showWrong && <XCircle size={28} color="#F44336" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedAnswer !== null && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
            activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    textAlign: 'center',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#FFE5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 6,
  },
  quizContainer: {
    padding: 20,
  },
  storyPreview: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  speakerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 34,
  },
  answersContainer: {
    gap: 16,
  },
  answerButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  answerButtonSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F0EFFF',
  },
  answerButtonCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  answerButtonWrong: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  answerLetter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterA: {
    backgroundColor: '#FF6B6B',
  },
  answerLetterB: {
    backgroundColor: '#4ECDC4',
  },
  answerLetterC: {
    backgroundColor: '#FFD93D',
  },
  answerLetterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  answerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    lineHeight: 26,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: '#FFE5DB',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  sparkleIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: '#6C757D',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#6C757D',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  percentageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  encouragement: {
    alignItems: 'center',
    marginBottom: 32,
  },
  encouragementText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
  },
  encouragementSubtext: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
