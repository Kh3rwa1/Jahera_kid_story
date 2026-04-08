import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Container } from '@/components/Container';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { cancelAll, registerForPushNotifications, scheduleBedtimeReminder } from '@/services/notificationService';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const KEY = 'jahera_bedtime_reminder';

export default function NotificationSettings() {
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(30);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(20, 30, 0, 0);
    return d;
  });

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setEnabled(Boolean(data.enabled));
        const h = data.hour ?? 20;
        const m = data.minute ?? 30;
        setHour(h);
        setMinute(m);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        setSelectedTime(d);
      }
    })();
  }, []);

  const persist = async (nextEnabled: boolean, h: number, m: number) => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ enabled: nextEnabled, hour: h, minute: m }));
    analytics.trackBedtimeReminderSet(h, m, nextEnabled);
  };

  const toggle = async (next: boolean) => {
    setEnabled(next);
    if (next) {
      await registerForPushNotifications();
      await scheduleBedtimeReminder(hour, minute);
    } else {
      await cancelAll();
    }
    await persist(next, hour, minute);
  };

  return (
    <Container>
      <View style={styles.row}>
        <Text style={[styles.title, { color: C.text.primary }]}>Daily story reminder</Text>
        <Switch value={enabled} onValueChange={toggle} />
      </View>

      <Text style={[styles.label, { color: C.text.secondary }]}>
        Bedtime reminder time
      </Text>

      {/* Tappable time display */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.85}
        style={[
          styles.timeTile,
          {
            backgroundColor: C.cardBackground,
            borderColor: C.text.light + '15',
          },
          SHADOWS.sm,
        ]}
      >
        <Text style={[styles.timeText, { color: C.text.primary }]}>
          {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={[styles.timeHint, { color: C.text.secondary }]}>
          Tap to change bedtime reminder
        </Text>
      </TouchableOpacity>

      {/* Native time picker */}
      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (event.type === 'dismissed') {
              setShowPicker(false);
              return;
            }
            if (date) {
              setSelectedTime(date);
              const h = date.getHours();
              const m = date.getMinutes();
              setHour(h);
              setMinute(m);
              scheduleBedtimeReminder(h, m);
              AsyncStorage.setItem(KEY, JSON.stringify({ enabled: true, hour: h, minute: m }));
              analytics.trackBedtimeReminderSet(h, m, true);
            }
          }}
        />
      )}

      {/* iOS needs an explicit Done button to dismiss the spinner */}
      {Platform.OS === 'ios' && showPicker && (
        <TouchableOpacity
          onPress={() => setShowPicker(false)}
          style={[styles.doneBtn, { backgroundColor: C.primary }]}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  label: {
    marginTop: SPACING.md,
    fontFamily: FONTS.medium,
  },
  timeTile: {
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: SPACING.lg,
  },
  timeText: {
    fontSize: 36,
    fontFamily: FONTS.display,
    letterSpacing: -1,
  },
  timeHint: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  doneBtn: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
