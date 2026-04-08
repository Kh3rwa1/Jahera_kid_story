import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { cancelAll, registerForPushNotifications, scheduleBedtimeReminder } from '@/services/notificationService';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, ChevronDown, ChevronLeft, ChevronUp, Clock, Moon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const STORAGE_KEY = 'jahera_bedtime_reminder';

type BedtimeReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export default function NotificationSettingsScreen() {
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [isEnabled, setIsEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(30);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: BedtimeReminderSettings = JSON.parse(saved);
          setIsEnabled(Boolean(parsed.enabled));
          setHour(typeof parsed.hour === 'number' ? parsed.hour : 20);
          setMinute(typeof parsed.minute === 'number' ? parsed.minute : 30);
        }
      } catch {
        // Ignore invalid persisted state and keep defaults
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const trackReminder = useCallback((enabled: boolean, nextHour?: number, nextMinute?: number) => {
    analytics.track('bedtime_reminder_set', {
      enabled,
      ...(typeof nextHour === 'number' ? { hour: nextHour } : {}),
      ...(typeof nextMinute === 'number' ? { minute: nextMinute } : {}),
    });
  }, []);

  const persistSettings = useCallback(async (next: BedtimeReminderSettings) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const formatTime = useCallback((h: number, m: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const twelveHour = h % 12 === 0 ? 12 : h % 12;
    const paddedMinute = `${m}`.padStart(2, '0');
    return `${twelveHour}:${paddedMinute} ${period}`;
  }, []);

  const handleToggle = useCallback(async (newValue: boolean) => {
    setIsEnabled(newValue);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (newValue) {
      await registerForPushNotifications();
      await scheduleBedtimeReminder(hour, minute);
      await persistSettings({ enabled: true, hour, minute });
      trackReminder(true, hour, minute);
      return;
    }

    await cancelAll();
    await persistSettings({ enabled: false, hour, minute });
    trackReminder(false);
  }, [hour, minute, persistSettings, trackReminder]);

  const handleTimeChange = useCallback(async (newHour: number, newMinute: number) => {
    setHour(newHour);
    setMinute(newMinute);

    if (isEnabled) {
      await scheduleBedtimeReminder(newHour, newMinute);
      await persistSettings({ enabled: true, hour: newHour, minute: newMinute });
      trackReminder(true, newHour, newMinute);
    } else {
      await persistSettings({ enabled: false, hour: newHour, minute: newMinute });
    }
  }, [isEnabled, persistSettings, trackReminder]);

  const styles = createStyles(C, isTablet);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={24} color={C.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bedtime Reminders</Text>
        <View style={styles.iconButton}>
          <Moon size={24} color={C.primary} />
        </View>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.heroWrap}>
          <LinearGradient
            colors={[`${C.primary}22`, `${C.primary}15`, `${C.primary}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCircle}
          >
            <Moon size={isTablet ? 52 : 40} color={C.primary} />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.card}>
          <View style={styles.row}>
            <Bell size={isTablet ? 26 : 22} color={C.primary} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.cardTitle}>Daily Reminder</Text>
              <Text style={styles.cardSubtitle}>Get a nudge at bedtime</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#E0E0E0', true: `${C.primary}40` }}
              thumbColor={isEnabled ? C.primary : '#F4F4F4'}
            />
          </View>
        </Animated.View>

        {isEnabled && (
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
            <View style={styles.row}>
              <Clock size={isTablet ? 26 : 22} color={C.primary} />
              <View style={styles.rowTextWrap}>
                <Text style={styles.cardTitle}>Story Time</Text>
                <Text style={styles.cardSubtitle}>When should we remind you?</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.timeDisplayButton}
              onPress={async () => {
                setShowPicker(true);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.timeText}>{formatTime(hour, minute)}</Text>
              <Text style={styles.timeHint}>Tap to change</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={new Date(2024, 0, 1, hour, minute)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowPicker(false);
                  }

                  if (selectedDate) {
                    void handleTimeChange(selectedDate.getHours(), selectedDate.getMinutes());
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && showPicker && (
              <TouchableOpacity style={styles.doneButton} onPress={() => setShowPicker(false)} activeOpacity={0.85}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.infoWrap}>
          <Text style={styles.infoText}>
            Stories work best as a bedtime routine. Pick a time that works for your family! 💤
          </Text>
          {isLoading && <Text style={styles.loadingText}>Loading your saved reminder…</Text>}
        </Animated.View>

        {/* Manual fallback controls are not needed because DateTimePicker is installed. */}
        <View style={styles.hiddenFallbackIcons}>
          <ChevronUp size={0} color="transparent" />
          <ChevronDown size={0} color="transparent" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (C: ReturnType<typeof useTheme>['currentTheme']['colors'], isTablet: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    iconButton: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: FONTS.bold,
      fontSize: isTablet ? 22 : 18,
      color: C.text.primary,
    },
    content: {
      padding: SPACING.lg,
    },
    heroWrap: {
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    heroCircle: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: C.cardBackground,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      ...SHADOWS.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowTextWrap: {
      flex: 1,
      marginLeft: SPACING.md,
    },
    cardTitle: {
      fontFamily: FONTS.semibold,
      fontSize: isTablet ? 18 : 16,
      color: C.text.primary,
    },
    cardSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: isTablet ? 15 : 13,
      marginTop: 2,
      color: C.text.secondary,
    },
    timeDisplayButton: {
      marginTop: SPACING.lg,
      alignItems: 'center',
    },
    timeText: {
      fontFamily: FONTS.bold,
      fontSize: isTablet ? 44 : 36,
      color: C.primary,
    },
    timeHint: {
      marginTop: 4,
      fontFamily: FONTS.regular,
      fontSize: isTablet ? 14 : 12,
      color: C.text.secondary,
    },
    doneButton: {
      marginTop: SPACING.md,
      alignSelf: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: `${C.primary}15`,
    },
    doneButtonText: {
      fontFamily: FONTS.semibold,
      fontSize: 16,
      color: C.primary,
    },
    infoWrap: {
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    infoText: {
      maxWidth: 300,
      textAlign: 'center',
      fontFamily: FONTS.regular,
      fontSize: isTablet ? 15 : 13,
      color: C.text.secondary,
    },
    loadingText: {
      marginTop: SPACING.sm,
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: C.text.light,
    },
    hiddenFallbackIcons: {
      position: 'absolute',
      opacity: 0,
    },
  });
