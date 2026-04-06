import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather';
import {
  ComicNeue_400Regular,
  ComicNeue_700Bold,
} from '@expo-google-fonts/comic-neue';
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
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReadingPreferencesProvider } from '@/contexts/ReadingPreferencesContext';
import { AudioProvider } from '@/contexts/AudioContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ReadingPreferencesProvider>
        <AuthProvider>
          <AppProvider>
            <AudioProvider>
            <Stack screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 250,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}>
              <Stack.Screen name="index" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom', animationDuration: 300 }} />
            <Stack.Screen name="parent-dashboard" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />
              <Stack.Screen name="story/generate" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
              <Stack.Screen name="story/playback" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
              <Stack.Screen name="story/quiz" options={{ animation: 'slide_from_right', animationDuration: 250 }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            </AudioProvider>
          </AppProvider>
        </AuthProvider>
        </ReadingPreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
