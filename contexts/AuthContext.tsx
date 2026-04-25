import { account, ID } from '@/lib/appwrite';
import { storage } from '@/utils/storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [session, setSession] = useState<Models.Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Fast path: load from cache immediately
        const cachedUser = await storage.getItem<Models.User<Models.Preferences>>('authUser');
        const cachedSession = await storage.getItem<Models.Session>('authSession');
        
        if (cachedUser && cachedSession) {
          setUser(cachedUser);
          setSession(cachedSession);
          setIsLoading(false); // Unblock UI immediately
          
          // 2. Background sync
          Promise.all([
            account.get(),
            account.getSession('current'),
          ]).then(([u, s]) => {
            setUser(u);
            setSession(s);
            storage.setItem('authUser', u).catch(() => {});
            storage.setItem('authSession', s).catch(() => {});
          }).catch((err) => {
            console.debug('Auth background sync failed, keeping cached session', err);
          });
          return;
        }

        // 3. Slow path: No cache, wait for network (with timeout)
        const fetchPromise = Promise.all([
          account.get(),
          account.getSession('current'),
        ]);
        
        const timeoutPromise = new Promise<[any, any]>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout fetching session')), 8000)
        );

        const [u, s] = await Promise.race([fetchPromise, timeoutPromise]);
        
        setUser(u);
        setSession(s);
        storage.setItem('authUser', u).catch(() => {});
        storage.setItem('authSession', s).catch(() => {});
      } catch (error) {
        console.debug('Auth init failed', error);
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
      storage.setItem('authUser', u).catch(() => {});
    } catch {
      // Don't nullify user on refresh failure (might be offline)
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      await account.create(ID.unique(), email, password, name);
      const sessionRes = await account.createEmailPasswordSession(
        email,
        password,
      );
      const userRes = await account.get();
      setSession(sessionRes);
      setUser(userRes);
      storage.setItem('authUser', userRes).catch(() => {});
      storage.setItem('authSession', sessionRes).catch(() => {});
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const sessionRes = await account.createEmailPasswordSession(
      email,
      password,
    );
    const userRes = await account.get();
    setSession(sessionRes);
    setUser(userRes);
    storage.setItem('authUser', userRes).catch(() => {});
    storage.setItem('authSession', sessionRes).catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    setSession(null);
    storage.removeItem('authUser').catch(() => {});
    storage.removeItem('authSession').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      signUp,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, session, isLoading, signUp, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
