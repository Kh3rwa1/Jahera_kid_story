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
import { Models, OAuthProvider } from 'react-native-appwrite';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

  // Handle deep link callback from OAuth
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const u = await account.get();
        const s = await account.getSession('current');
        setUser(u);
        setSession(s);
        storage.setItem('authUser', u).catch(() => {});
        storage.setItem('authSession', s).catch(() => {});
      } catch {
        // Not authenticated yet
      }
    };

    const subscription = Linking.addEventListener('url', () => {
      handleDeepLink();
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const cachedUser =
          await storage.getItem<Models.User<Models.Preferences>>('authUser');
        const cachedSession =
          await storage.getItem<Models.Session>('authSession');

        if (cachedUser && cachedSession) {
          setUser(cachedUser);
          setSession(cachedSession);
          setIsLoading(false);

          Promise.all([account.get(), account.getSession('current')])
            .then(([u, s]) => {
              setUser(u);
              setSession(s);
              storage.setItem('authUser', u).catch(() => {});
              storage.setItem('authSession', s).catch(() => {});
            })
            .catch((err) => {
              console.debug(
                'Auth background sync failed, keeping cached session',
                err,
              );
            });
          return;
        }

        const fetchPromise = Promise.all([
          account.get(),
          account.getSession('current'),
        ]);

        const timeoutPromise = new Promise<
          [Models.User<Models.Preferences>, Models.Session]
        >((_, reject) =>
          setTimeout(
            () => reject(new Error('Network timeout fetching session')),
            8000,
          ),
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
      // Don\u0027t nullify user on refresh failure (might be offline)
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

  const signInWithGoogle = useCallback(async () => {
    try {
      // Build redirect URLs using the app scheme
      const redirectUrl = Linking.createURL('/');

      // Create OAuth2 session with Appwrite
      // On native, this opens the browser; on web, it redirects
      const response = account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl, // success redirect
        redirectUrl, // failure redirect
      );

      if (Platform.OS !== 'web') {
        // On native, open the OAuth URL in system browser
        if (response && typeof response === 'object' && 'href' in response) {
          await WebBrowser.openBrowserAsync(
            String((response as { href: string }).href),
          );
        } else if (typeof response === 'string') {
          await WebBrowser.openBrowserAsync(response);
        }
      }

      // After redirect back, fetch the session
      const u = await account.get();
      const s = await account.getSession('current');
      setUser(u);
      setSession(s);
      storage.setItem('authUser', u).catch(() => {});
      storage.setItem('authSession', s).catch(() => {});
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      const msg =
        error instanceof Error ? error.message : 'Google sign-in failed';
      throw new Error(msg);
    }
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
      signInWithGoogle,
      signOut,
      refreshUser,
    }),
    [
      user,
      session,
      isLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshUser,
    ],
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
