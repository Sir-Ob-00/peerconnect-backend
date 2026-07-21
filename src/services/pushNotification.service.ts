import { logger } from "../config/logger";

/**
 * Push notifications are explicitly optional for this phase — this file
 * exists so the *shape* of the integration is in place, not the delivery
 * itself. To finish this later:
 *
 *   1. Add a `DeviceToken` model (userId, token, platform) + a
 *      `POST /devices/register` endpoint for clients to submit their Expo
 *      push token (the mobile app already calls
 *      `Notifications.getExpoPushTokenAsync()` — see its
 *      `notificationService.registerForPushNotifications`).
 *   2. Replace the body of `sendPushNotification` below with a real call to
 *      the Expo push API (or FCM/APNs directly) using the stored tokens for
 *      `userId`.
 *   3. Call it from `notification.service.ts`'s `createNotification`,
 *      alongside the existing Socket.IO push.
 *
 * Until then, this safely no-ops (just logs at debug level) so it can
 * already be wired into the notification flow without affecting behavior.
 */
export const pushNotificationService = {
  async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    logger.debug(`[push:not-implemented] would notify user=${userId}: "${title}" — ${body}`);
  },
};
