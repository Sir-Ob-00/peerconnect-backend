export const NOTIFICATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  /** The Socket.IO event name pushed to a user's personal room when a notification is created. */
  SOCKET_EVENT: "notification:new",
} as const;
