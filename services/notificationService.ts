import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const BEDTIME_MESSAGES = [
  "Time for tonight's adventure! 🌙",
  'A magical story is waiting at bedtime ✨',
  'Ready for cuddles and a new tale? 📚',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync();

  await Notifications.setNotificationChannelAsync('bedtime', {
    name: 'Bedtime Stories',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });

  return token.data;
}

export async function scheduleBedtimeReminder(hour: number, minute: number): Promise<string> {
  const body = BEDTIME_MESSAGES[Math.floor(Math.random() * BEDTIME_MESSAGES.length)];
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Jahera', body, sound: 'default' },
    trigger: { hour, minute, repeats: true, channelId: 'bedtime', type: Notifications.SchedulableTriggerInputTypes.DAILY },
  });
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
