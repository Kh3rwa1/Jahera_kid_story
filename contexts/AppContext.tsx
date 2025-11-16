import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProfileWithRelations } from '@/types/database';
import { profileServiceImproved } from '@/services/databaseImproved';
import { storage } from '@/utils/storage';
import { handleError, showErrorAlert } from '@/utils/errorHandler';

interface AppContextType {
  profile: ProfileWithRelations | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ProfileWithRelations>) => void;
  clearProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileId = await storage.getProfileId();
      if (!profileId) {
        setProfile(null);
        return;
      }

      const data = await profileServiceImproved.getWithRelations(profileId);
      setProfile(data);
    } catch (err) {
      const appError = handleError(err, 'AppContext.loadProfile');
      setError(appError.message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (updates: Partial<ProfileWithRelations>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const clearProfile = async () => {
    try {
      await storage.removeProfileId();
      setProfile(null);
      setError(null);
    } catch (err) {
      const appError = handleError(err, 'AppContext.clearProfile');
      showErrorAlert(appError, 'Error Clearing Profile');
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const value: AppContextType = {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    clearProfile,
    refreshProfile,
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
