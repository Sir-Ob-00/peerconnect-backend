/**
 * Room-naming helpers shared by every real-time feature (chat, notifications,
 * and anything added later) — not chat-specific, even though chat was the
 * first consumer. Kept in one place so "which room does user X's socket
 * join" has exactly one definition.
 */
export const SOCKET_CONSTANTS = {
  /** Personal room every one of a user's connected devices/tabs joins on connect (sockets/index.ts). Used for direct-to-user delivery: chat messages, typing relays, and notifications all target this room. */
  userRoom: (userId: string) => `user:${userId}`,
  /** Optional room a socket can join to represent "actively viewing this conversation" (chat only). */
  conversationRoom: (conversationId: string) => `conversation:${conversationId}`,
  chatRoom: (chatId: string) => `chatroom:${chatId}`,
} as const;
