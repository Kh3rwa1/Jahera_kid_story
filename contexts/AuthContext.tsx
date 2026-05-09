import { APPWRITE_PROJECT_ID, account, ID } from '@/lib/appwrite';
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
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type OAuthCallback = {
  userId: string | null;
  secret: string | null;
  error?: string;
};

function getOAuthCallback(url: string | null | undefined): OAuthCallback {
  if (!url) return { userId: null, secret: null };

  const parsed = Linking.parse(url);
  const userId = (parsed.queryParams?.userId as string | undefined) ?? null;
  const secret = (parsed.queryParams?.secret as string | undefined) ?? null;
  const error =
    (parsed.queryParams?.error_description as string | undefined) ||
    (parsed.queryParams?.error as string | undefined);

  if (userId || secret || error) {
    return { userId, secret, error };
  }

  const userIdMatch = url.match(/userId=([^&#]+)/);
  const secretMatch = url.match(/secret=([^&#]+)/);
  return {
    userId: userIdMatch?.[1] ?? null,
    secret: secretMatch?.[1] ?? null,
  };
}

async function persistAuth(
  sessionRes: Models.Session,
  userRes: Models.User<Models.Preferences>,
) {
  await Promise.allSettled([
    storage.setItem('authUser', userRes),
    storage.setItem('authSession', sessionRes),
  ]);
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
    let isMounted = true;

    const createSessionFromCallback = async (
      callback: OAuthCallback,
      source: string,
    ) => {
      if (!callback.userId || !callback.secret) return false;

      console.log(`[OAuth] Creating session from ${source} callback.`);
      const sessionRes = await account.createSession(
        callback.userId,
        callback.secret,
      );
      const userRes = await account.get();

      if (!isMounted) return true;
      setSession(sessionRes);
      setUser(userRes);
      persistAuth(sessionRes, userRes).catch(() => {});

      return true;
    };

    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      const callback = getOAuthCallback(url);
      if (!callback.userId || !callback.secret) return;

      createSessionFromCallback(callback, 'deep-link').catch((err) => {
        console.warn('[OAuth] Deep-link session creation failed:', err);
      });
    });

    const initAuth = async () => {
      try {
        let callback: OAuthCallback = { userId: null, secret: null };

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          callback = getOAuthCallback(window.location.href);
        }

        if (!callback.userId || !callback.secret) {
          callback = getOAuthCallback(await Linking.getInitialURL());
        }

        if (callback.userId && callback.secret) {
          try {
            await createSessionFromCallback(callback, 'initial-url');
            if (isMounted) setIsLoading(false);
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, '', '/');
            }
            return;
          } catch (err) {
            console.warn(
              '[OAuth] Initial callback session creation failed:',
              err,
            );
            // Fall through to normal auth init
          }
        }

        const cachedUser =
          await storage.getItem<Models.User<Models.Preferences>>('authUser');
        const cachedSession =
          await storage.getItem<Models.Session>('authSession');

        if (cachedUser && cachedSession) {
          if (!isMounted) return;
          setUser(cachedUser);
          setSession(cachedSession);
          setIsLoading(false);

          Promise.all([account.get(), account.getSession('current')])
            .then(([u, s]) => {
              if (!isMounted) return;
              setUser(u);
              setSession(s);
              persistAuth(s, u).catch(() => {});
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

        if (!isMounted) return;
        setUser(u);
        setSession(s);
        persistAuth(s, u).catch(() => {});
      } catch (error) {
        console.debug('Auth init failed', error);
        if (!isMounted) return;
        setUser(null);
        setSession(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      urlSubscription.remove();
    };
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

  const signInWithGoogle = useCallback(async () => {
    try {
      // Use standard Appwrite callback scheme for native builds.
      const isExpoGo = Constants.appOwnership === 'expo';
      const deepLink =
        Platform.OS === 'web'
          ? window.location.origin
          : isExpoGo
            ? Linking.createURL('/')
            : `appwrite-callback-${APPWRITE_PROJECT_ID}://`;

      console.log('[OAuth] Starting Google sign-in.');

      // Use createOAuth2Token — returns userId & secret as query params
      const url = account.createOAuth2Token(
        OAuthProvider.Google,
        deepLink,
        deepLink,
      );

      if (!url) {
        throw new Error('Failed to create OAuth URL');
      }

      const urlString = url instanceof URL ? url.toString() : String(url);

      // ── WEB: Direct page redirect (most reliable) ──
      // Popups are blocked by browsers and often fail to capture the redirect.
      // Instead, redirect the current page to Google, then when Appwrite
      // redirects back to localhost?userId=xxx&secret=yyy, the initAuth
      // handler in useEffect catches the tokens automatically.
      if (Platform.OS === 'web') {
        window.location.href = urlString;
        return;
      }

      // ── NATIVE: Use WebBrowser + Linking listener fallback ──
      let linkingUrl: string | null = null;
      const linkingPromise = new Promise<string>((resolve) => {
        const sub = Linking.addEventListener('url', (event) => {
          if (event.url.includes('userId=') && event.url.includes('secret=')) {
            sub.remove();
            resolve(event.url);
          }
        });
        setTimeout(() => {
          sub.remove();
        }, 60000);
      });

      const result = await WebBrowser.openAuthSessionAsync(urlString, deepLink);

      let userId: string | null = null;
      let secret: string | null = null;

      if (result.type === 'success' && result.url) {
        console.log('[OAuth] Browser returned OAuth callback.');
        linkingUrl = result.url;
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log(
          '[OAuth] Browser returned:',
          result.type,
          '- checking Linking fallback...',
        );

        linkingUrl = await Promise.race([
          linkingPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (!linkingUrl) {
          try {
            const existingUser = await account.get();
            const existingSession = await account.getSession('current');
            setUser(existingUser);
            setSession(existingSession);
            storage.setItem('authUser', existingUser).catch(() => {});
            storage.setItem('authSession', existingSession).catch(() => {});
            console.log('[OAuth] Session found after browser dismiss');
            return;
          } catch {
            throw new Error('Google sign-in was cancelled');
          }
        }
      } else {
        throw new Error('Google sign-in was cancelled');
      }

      if (linkingUrl) {
        const callback = getOAuthCallback(linkingUrl);
        if (callback.error)
          throw new Error(`Appwrite OAuth Error: ${callback.error}`);
        userId = callback.userId;
        secret = callback.secret;
      }

      if (!userId || !secret) {
        console.warn('[OAuth] Missing userId or secret in callback.');

        // Detailed error to help the user understand WHY it failed
        if (isExpoGo) {
          throw new Error(
            'Google Sign-In requires the built APK to work correctly. It cannot complete in Expo Go because the callback URL is not registered.',
          );
        }

        throw new Error(`Missing userId or secret from OAuth callback.`);
      }

      console.log('[OAuth] Creating session with callback token.');
      const sessionRes = await account.createSession(userId, secret);
      const userRes = await account.get();

      setSession(sessionRes);
      setUser(userRes);
      persistAuth(sessionRes, userRes).catch(() => {});
      console.log('[OAuth] Sign-in successful!');
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

  const deleteAccount = useCallback(async () => {
    try {
      // Appwrite client SDK doesn't allow hard delete.
      // updateStatus() blocks the account permanently.
      await account.updateStatus();
    } catch (e) {
      console.error('Delete account error:', e);
    }

    try {
      await account.deleteSession('current');
    } catch {
      // Ignore
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
      deleteAccount,
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
      deleteAccount,
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
