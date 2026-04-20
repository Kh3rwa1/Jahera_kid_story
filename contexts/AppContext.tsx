import { useAuth } from '@/contexts/AuthContext';
import { profileService, quizService, storyService } from '@/services/database';
import {
  PlanType,
  revenueCatService,
} from '@/services/revenueCatServiceInternal';
import {
  streakService,
  subscriptionService,
} from '@/services/subscriptionService';
import {
  ProfileWithRelations,
  QuizAttempt,
  Story,
  Streak,
  SubscriptionStatus,
} from '@/types/database';
import { handleError } from '@/utils/errorHandler';
import { personalizeStories } from '@/utils/nameSubstitution';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [streak, setStreak] = useState<Streak | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rcListenerCleanupRef = useRef<(() => void) | null>(null);
  const profileIdRef = useRef<string | null>(null);

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

      await revenueCatService.identify(user.$id);

      const data = await profileService.getWithRelationsByUserId(user.$id);
      if (!data) {
        setProfile(null);
        setStories([]);
        setSubscription(null);
        setStreak(null);
        setQuizAttempts([]);
        return;
      }

      setProfile(data);
      profileIdRef.current = data.id;

      const [storiesData, attemptsData, subData, streakData] =
        await Promise.all([
          storyService.getAll(),
          quizService.getAttemptsByProfileId(data.id),
          subscriptionService.getStatus(data.id),
          streakService.getStreak(data.id),
        ]);

      setStories(
        personalizeStories(storiesData || [], data.kid_name, data.city),
      );
      setQuizAttempts(attemptsData || []);
      setSubscription(subData);
      setStreak(streakData);

      if (rcListenerCleanupRef.current) {
        rcListenerCleanupRef.current();
      }
      rcListenerCleanupRef.current = revenueCatService.addCustomerInfoListener(
        (rcInfo) => {
          (async () => {
            const pid = profileIdRef.current;
            if (!pid) return;
            try {
              await subscriptionService.syncFromRevenueCat(pid);
              const [newSubData, newStreakData] = await Promise.all([
                subscriptionService.getStatus(pid),
                streakService.getStreak(pid),
              ]);
              setSubscription(newSubData);
              setStreak(newStreakData);
            } catch {
              // ignore background sync errors
            }
          })();
        },
      );
    } catch (err) {
      const appError = handleError(err, 'AppContext.loadProfile');
      setError(appError.message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(
    (updates: Partial<ProfileWithRelations>) => {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [],
  );

  const clearProfile = useCallback(() => {
    if (rcListenerCleanupRef.current) {
      rcListenerCleanupRef.current();
      rcListenerCleanupRef.current = null;
    }
    profileIdRef.current = null;
    revenueCatService.reset();
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
      const data = await storyService.getAll();
      setStories(
        personalizeStories(data || [], profile.kid_name, profile.city),
      );
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

  const refreshSubscription = useCallback(async () => {
    if (!profile) return;
    try {
      const [subData, streakData] = await Promise.all([
        subscriptionService.getStatus(profile.id),
        streakService.getStreak(profile.id),
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

  const value: AppContextType = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
