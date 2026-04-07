import { account,ID } from '@/lib/appwrite';
import React,{ createContext,ReactNode,useCallback,useContext,useEffect,useMemo,useState } from 'react';
import { Models } from 'react-native-appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [session, setSession] = useState<Models.Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const [u, s] = await Promise.all([
          account.get(),
          account.getSession('current'),
        ]);
        setUser(u);
        setSession(s);
      } catch (error) {
        console.debug('Auth init: no active session', error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await account.get();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    await account.create(ID.unique(), email, password, name);
    const [sessionRes, userRes] = await Promise.all([
      account.createEmailPasswordSession(email, password),
      account.get(),
    ]);
    setSession(sessionRes);
    setUser(userRes);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const [sessionRes, userRes] = await Promise.all([
      account.createEmailPasswordSession(email, password),
      account.get(),
    ]);
    setSession(sessionRes);
    setUser(userRes);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }), [user, session, isLoading, signUp, signIn, signOut, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
