import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProfileWithRelations, Story, QuizAttempt } from '@/types/database';
import { profileService, storyService, quizService } from '@/services/database';
import { storage } from '@/utils/storage';
import { handleError } from '@/utils/errorHandler';

interface AppContextType {
  profile: ProfileWithRelations | null;
  stories: Story[];
  quizAttempts: QuizAttempt[];
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileWithRelations>) => void;
  clearProfile: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshStories: () => Promise<void>;
  refreshQuizAttempts: () => Promise<void>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileId = await storage.getProfileId();
      if (!profileId) {
        setProfile(null);
        setStories([]);
        setQuizAttempts([]);
        return;
      }

      const data = await profileService.getWithRelations(profileId);
      if (!data) {
        setProfile(null);
        setStories([]);
        setQuizAttempts([]);
        return;
      }

      setProfile(data);

      const [storiesData, attemptsData] = await Promise.all([
        storyService.getByProfileId(profileId),
        quizService.getAttemptsByProfileId(profileId),
      ]);

      setStories(storiesData || []);
      setQuizAttempts(attemptsData || []);
    } catch (err) {
      const appError = handleError(err, 'AppContext.loadProfile');
      setError(appError.message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback((updates: Partial<ProfileWithRelations>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearProfile = useCallback(async () => {
    try {
      await storage.removeProfileId();
      setProfile(null);
      setStories([]);
      setQuizAttempts([]);
      setError(null);
    } catch (err) {
      handleError(err, 'AppContext.clearProfile');
    }
  }, []);

  const refreshStories = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await storyService.getByProfileId(profile.id);
      setStories(data || []);
    } catch (err) {
      handleError(err, 'AppContext.refreshStories');
    }
  }, [profile]);

  const refreshQuizAttempts = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await quizService.getAttemptsByProfileId(profile.id);
      setQuizAttempts(data || []);
    } catch (err) {
      handleError(err, 'AppContext.refreshQuizAttempts');
    }
  }, [profile]);

  const refreshAll = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const value: AppContextType = {
    profile,
    stories,
    quizAttempts,
    isLoading,
    error,
    loadProfile,
    updateProfile,
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
