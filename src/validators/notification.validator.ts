import { z } from "zod";
import { NOTIFICATION_CONSTANTS } from "../constants/notification.constants";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(NOTIFICATION_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(NOTIFICATION_CONSTANTS.MAX_PAGE_SIZE)
    .default(NOTIFICATION_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
});
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
