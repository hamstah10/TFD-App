import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Push notifications don't work on web
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web');
      return null;
    }

    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#bbcf4e',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Aufträge',
        description: 'Benachrichtigungen über Auftragsänderungen',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4caf50',
      });

      await Notifications.setNotificationChannelAsync('tickets', {
        name: 'Support-Tickets',
        description: 'Benachrichtigungen über neue Ticket-Nachrichten',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196f3',
      });
    }

    // Get Expo push token
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    console.log('Expo push token obtained:', token);
    return token;
  } catch (error) {
    // Silently fail for push token errors - this is expected on web/simulators
    console.log('Push notifications not available:', (error as Error).message);
    return null;
  }
}

export async function registerPushTokenWithBackend(
  accessToken: string,
  expoPushToken: string
): Promise<boolean> {
  try {
    await api.post('/push/register', {
      expoPushToken,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

export async function unregisterPushToken(accessToken: string): Promise<boolean> {
  try {
    await api.post('/push/unregister', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('Push token unregistered from backend');
    return true;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    return false;
  }
}

// Type for notification data
export interface NotificationData {
  type: 'order_update' | 'ticket_reply';
  orderId?: string;
  orderNumber?: string;
  ticketId?: string;
  ticketNumber?: string;
  status?: string;
}

// Add notification listener
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add response listener (when user taps notification)
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Remove subscription
export function removeNotificationSubscription(subscription: Notifications.Subscription): void {
  Notifications.removeNotificationSubscription(subscription);
}

// Get last notification response (for handling app launch from notification)
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
