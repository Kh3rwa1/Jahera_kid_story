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
import Constants from 'expo-constants';
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
    const initAuth = async () => {
      try {
        // Check for OAuth callback params in URL (web redirect / deep link flow)
        let oauthUserId: string | null = null;
        let oauthSecret: string | null = null;

        // On web, directly check window.location which is the most reliable source
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          oauthUserId = params.get('userId');
          oauthSecret = params.get('secret');
        }

        // Fallback: check Linking.getInitialURL for native deep links
        if (!oauthUserId || !oauthSecret) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const userIdMatch = initialUrl.match(/userId=([^&#]+)/);
            const secretMatch = initialUrl.match(/secret=([^&#]+)/);
            oauthUserId = userIdMatch?.[1] ?? null;
            oauthSecret = secretMatch?.[1] ?? null;
          }
        }

        if (oauthUserId && oauthSecret) {
          console.log('[OAuth] Found callback params, creating session...');
          try {
            const sessionRes = await account.createSession(oauthUserId, oauthSecret);
            const userRes = await account.get();
            setSession(sessionRes);
            setUser(userRes);
            storage.setItem('authUser', userRes).catch(() => {});
            storage.setItem('authSession', sessionRes).catch(() => {});
            setIsLoading(false);
            // Clean URL on web so params don't persist on refresh
            if (typeof window !== 'undefined' && window.history) {
              window.history.replaceState({}, '', '/');
            }
            return;
          } catch (err) {
            console.warn('[OAuth] Session creation from URL params failed:', err);
            // Fall through to normal auth init
          }
        }

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
      const projectId = '69b5657c000d2c28a436';
      
      // Use standard Appwrite callback scheme for native builds.
      const isExpoGo = Constants.appOwnership === 'expo';
      const deepLink = Platform.OS === 'web' 
        ? window.location.origin 
        : (isExpoGo ? Linking.createURL('/') : `appwrite-callback-${projectId}://`);
        
      console.log('[OAuth] Redirect URL:', deepLink);

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
        setTimeout(() => { sub.remove(); }, 60000);
      });

      const result = await WebBrowser.openAuthSessionAsync(urlString, deepLink);

      let userId: string | null = null;
      let secret: string | null = null;

      if (result.type === 'success' && result.url) {
        console.log('[OAuth] Success URL:', result.url);
        linkingUrl = result.url;
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[OAuth] Browser returned:', result.type, '- checking Linking fallback...');
        
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
        console.log('[OAuth] Processing callback URL:', linkingUrl);
        const parsed = Linking.parse(linkingUrl);
        
        // If Appwrite returned an error (e.g. unregistered platform URL)
        if (parsed.queryParams?.error) {
           const errorMsg = parsed.queryParams?.error_description || parsed.queryParams?.error;
           throw new Error(`Appwrite OAuth Error: ${errorMsg}`);
        }
        
        userId = (parsed.queryParams?.userId as string) || null;
        secret = (parsed.queryParams?.secret as string) || null;

        // Fallback regex matching in case Linking.parse failed to extract query params
        if (!userId || !secret) {
          const userIdMatch = linkingUrl.match(/userId=([^&#]+)/);
          const secretMatch = linkingUrl.match(/secret=([^&#]+)/);
          userId = userIdMatch ? userIdMatch[1] : null;
          secret = secretMatch ? secretMatch[1] : null;
        }
      }

      if (!userId || !secret) {
        console.warn('[OAuth] Missing tokens. URL was:', linkingUrl);
        
        // Detailed error to help the user understand WHY it failed
        if (isExpoGo) {
          throw new Error('Google Sign-In requires the built APK to work correctly. It cannot complete in Expo Go because the callback URL is not registered.');
        }
        
        throw new Error(`Missing userId or secret from OAuth callback.`);
      }

      console.log('[OAuth] Creating session with token...');
      const sessionRes = await account.createSession(userId, secret);
      const userRes = await account.get();

      setSession(sessionRes);
      setUser(userRes);
      storage.setItem('authUser', userRes).catch(() => {});
      storage.setItem('authSession', sessionRes).catch(() => {});
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
    } catch (e) {
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
