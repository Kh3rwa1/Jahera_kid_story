import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReadingPreferencesProvider } from '@/contexts/ReadingPreferencesContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UIProvider } from '@/contexts/UIContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { revenueCatService } from '@/services/revenueCatServiceInternal';
import { logger } from '@/utils/logger';
import { scheduleBedtimeReminder } from '@/services/notificationService';
import { videoCacheService } from '@/services/videoCacheServiceInternal';
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  ComicNeue_400Regular,
  ComicNeue_700Bold,
} from '@expo-google-fonts/comic-neue';
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const initServices = async () => {
      // 1. RevenueCat Configuration (Critical for Pro features)
      try {
        await revenueCatService.configure();
      } catch (err) {
        logger.warn(
          '[RootLayout] RevenueCat init failed (Bridge may be missing):',
          err,
        );
      }

      // 2. Video Caching (Non-critical, run background)
      try {
        videoCacheService.prefetch().catch(() => {});
      } catch {
        logger.debug('[RootLayout] Video prefetch skip');
      }

      // 3. Bedtime Reminder Notifications (Non-critical, delay for interactivity)
      try {
        const raw = await AsyncStorage.getItem('jahera_bedtime_reminder');
        if (raw) {
          const data = JSON.parse(raw);
          if (data?.enabled) {
            setTimeout(() => {
              scheduleBedtimeReminder(data.hour ?? 20, data.minute ?? 30).catch(
                () => {},
              );
            }, 3000);
          }
        }
      } catch {
        logger.debug('[RootLayout] Reminder init skip');
      }
    };

    // Use a small delay to let the initial font/component mount complete
    const timer = setTimeout(initServices, 100);
    return () => clearTimeout(timer);
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'Merriweather-Regular': Merriweather_400Regular,
    'Merriweather-Bold': Merriweather_700Bold,
    'ComicNeue-Regular': ComicNeue_400Regular,
    'ComicNeue-Bold': ComicNeue_700Bold,
    'Atkinson-Regular': AtkinsonHyperlegible_400Regular,
    'Atkinson-Bold': AtkinsonHyperlegible_700Bold,
    'Baloo2-Regular': Baloo2_400Regular,
    'Baloo2-Medium': Baloo2_500Medium,
    'Baloo2-SemiBold': Baloo2_600SemiBold,
    'Baloo2-Bold': Baloo2_700Bold,
    'Baloo2-ExtraBold': Baloo2_800ExtraBold,
  });

  useEffect(() => {
    // Safety timeout: Never stay on splash screen longer than 8 seconds
    const safety = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 8000);
    return () => clearTimeout(safety);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UIProvider>
          <ReadingPreferencesProvider>
            <AuthProvider>
              <AppProvider>
                <AudioProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      animationDuration: 300,
                      gestureEnabled: true,
                      fullScreenGestureEnabled: true,
                      gestureDirection: 'horizontal',
                    }}
                  >
                    <Stack.Screen
                      name="index"
                      options={{ animation: 'fade', animationDuration: 200 }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ animation: 'fade', animationDuration: 250 }}
                    />
                    <Stack.Screen
                      name="paywall"
                      options={{
                        presentation: 'modal',
                        animation: 'slide_from_bottom',
                        animationDuration: 350,
                      }}
                    />
                    <Stack.Screen name="parent-dashboard" />
                    <Stack.Screen
                      name="auth/login"
                      options={{ animation: 'fade', animationDuration: 280 }}
                    />
                    <Stack.Screen
                      name="auth/register"
                      options={{ animation: 'fade', animationDuration: 280 }}
                    />
                    <Stack.Screen
                      name="story/generate"
                      options={{
                        animation: 'fade_from_bottom',
                        animationDuration: 320,
                      }}
                    />
                    <Stack.Screen
                      name="story/playback"
                      options={{
                        animation: 'fade_from_bottom',
                        animationDuration: 320,
                      }}
                    />
                    <Stack.Screen
                      name="story/quiz"
                      options={{
                        animation: 'slide_from_right',
                        animationDuration: 300,
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </AudioProvider>
              </AppProvider>
            </AuthProvider>
          </ReadingPreferencesProvider>
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
