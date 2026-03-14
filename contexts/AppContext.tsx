import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProfileWithRelations, Story, QuizAttempt, SubscriptionStatus, Streak } from '@/types/database';
import { profileService, storyService, quizService } from '@/services/database';
import { subscriptionService, streakService } from '@/services/subscriptionService';
import { handleError } from '@/utils/errorHandler';
import { useAuth } from '@/contexts/AuthContext';

interface AppContextType {
  profile: ProfileWithRelations | null;
  stories: Story[];
  quizAttempts: QuizAttempt[];
  subscription: SubscriptionStatus | null;
  streak: Streak | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileWithRelations>) => void;
  clearProfile: () => void;
  refreshAll: () => Promise<void>;
  refreshStories: () => Promise<void>;
  refreshQuizAttempts: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setStories([]);
      setQuizAttempts([]);
      setSubscription(null);
      setStreak(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await profileService.getWithRelationsByUserId(user.id);
      if (!data) {
        setProfile(null);
        setStories([]);
        setSubscription(null);
        setStreak(null);
        setQuizAttempts([]);
        return;
      }

      setProfile(data);

      const [storiesData, attemptsData, subData, streakData] = await Promise.all([
        storyService.getByProfileId(data.$id),
        quizService.getAttemptsByProfileId(data.$id),
        subscriptionService.getStatus(data.$id),
        streakService.getStreak(data.$id),
      ]);

      setStories(storiesData || []);
      setQuizAttempts(attemptsData || []);
      setSubscription(subData);
      setStreak(streakData);
    } catch (err) {
      const appError = handleError(err, 'AppContext.loadProfile');
      setError(appError.message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback((updates: Partial<ProfileWithRelations>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setStories([]);
    setQuizAttempts([]);
    setSubscription(null);
    setStreak(null);
    setError(null);
  }, []);

  const refreshStories = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await storyService.getByProfileId(profile.$id);
      setStories(data || []);
    } catch (err) {
      handleError(err, 'AppContext.refreshStories');
    }
  }, [profile]);

  const refreshQuizAttempts = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await quizService.getAttemptsByProfileId(profile.$id);
      setQuizAttempts(data || []);
    } catch (err) {
      handleError(err, 'AppContext.refreshQuizAttempts');
    }
  }, [profile]);

  const refreshSubscription = useCallback(async () => {
    if (!profile) return;
    try {
      const [subData, streakData] = await Promise.all([
        subscriptionService.getStatus(profile.$id),
        streakService.getStreak(profile.$id),
      ]);
      setSubscription(subData);
      setStreak(streakData);
    } catch (err) {
      handleError(err, 'AppContext.refreshSubscription');
    }
  }, [profile]);

  const refreshAll = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadProfile();
      } else {
        setProfile(null);
        setStories([]);
        setQuizAttempts([]);
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, loadProfile]);

  const value: AppContextType = {
    profile,
    stories,
    quizAttempts,
    subscription,
    streak,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    refreshSubscription,
    clearProfile,
    refreshAll,
    refreshStories,
    refreshQuizAttempts,
    setStories,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
