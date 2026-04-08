import AsyncStorage from '@react-native-async-storage/async-storage';
import { Container } from '@/components/Container';
import { FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { cancelAll, registerForPushNotifications, scheduleBedtimeReminder } from '@/services/notificationService';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const KEY = 'jahera_bedtime_reminder';

export default function NotificationSettings() {
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(30);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setEnabled(Boolean(data.enabled));
        setHour(data.hour ?? 20);
        setMinute(data.minute ?? 30);
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
      <View style={styles.row}><Text style={[styles.title, { color: C.text.primary }]}>Daily story reminder</Text><Switch value={enabled} onValueChange={toggle} /></View>
      <Text style={[styles.label, { color: C.text.secondary }]}>Default time: {String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={async () => { const h = 20; const m = 30; setHour(h); setMinute(m); if (enabled) { await cancelAll(); await scheduleBedtimeReminder(h,m);} await persist(enabled,h,m); }}><Text style={{ color: C.primary, fontFamily: FONTS.bold }}>Set 8:30 PM</Text></TouchableOpacity>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xl }, title: { fontFamily: FONTS.bold, fontSize: 18 }, label: { marginTop: SPACING.md, fontFamily: FONTS.medium }, buttons: { marginTop: SPACING.lg } });
