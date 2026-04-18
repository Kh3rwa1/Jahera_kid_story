import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BEDTIME_MESSAGES = [
  "Time for tonight's adventure! 🌙",
  'A magical story is waiting at bedtime ✨',
  'Ready for cuddles and a new tale? 📚',
];

// Guard: expo-notifications remote push support was removed from Expo Go in SDK 53.
// We lazy-import the module to prevent the error that fires at import time.
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Lazily loads expo-notifications only when needed and NOT in Expo Go.
 * Returns null in Expo Go to avoid the native module crash.
 */
function getNotificationsModule() {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

// Set notification handler only in dev/production builds (not Expo Go)
if (!isExpoGo) {
  const Notifications = getNotificationsModule();
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    console.warn('[Notifications] Push notifications are not supported in Expo Go. Use a development build.');
    return null;
  }
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bedtime', {
      name: 'Bedtime Stories',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  return token.data;
}

export async function scheduleBedtimeReminder(hour: number, minute: number): Promise<string> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    console.warn('[Notifications] Local notifications have limited support in Expo Go.');
    return 'expo-go-stub';
  }
  const body = BEDTIME_MESSAGES[Math.floor(Math.random() * BEDTIME_MESSAGES.length)];
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Jahera', body, sound: 'default' },
    trigger: { hour, minute, channelId: 'bedtime', type: Notifications.SchedulableTriggerInputTypes.DAILY },
  });
}

export async function cancelAll(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
