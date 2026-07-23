import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";
import { chatService } from "../services/chat.service";
import { onlineUsersRegistry } from "./onlineUsers.registry";
import { SOCKET_CONSTANTS } from "../constants/socket.constants";
import { ApiError } from "../utils/ApiError";
import {
  conversationRoomSocketSchema,
  markReadSocketSchema,
  sendMessageSocketSchema,
  groupRoomSocketSchema,
} from "../validators/chat.validator";
import type { AuthenticatedSocket } from "./socketAuth.middleware";

/** Sends a client-safe error back to the emitting socket only — never a stack trace, never broadcast. */
function emitError(socket: Socket, err: unknown): void {
  let message = "Something went wrong.";
  if (err instanceof ZodError) {
    message = err.issues.map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`).join("; ");
  } else if (err instanceof ApiError) {
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }
  socket.emit("error", { message });
}

/**
 * Registers every chat-related event listener for one authenticated
 * connection. Called once per socket from the `connection` handler in
 * `sockets/index.ts`. Kept as a single function (rather than one file per
 * event) since each handler is short and they all share the same
 * `userId`/`io` closures — splitting further would add indirection without
 * much benefit at this size ("keep architecture simple").
 */
export function registerChatHandlers(io: Server, socket: Socket): void {
  const { userId } = (socket as AuthenticatedSocket).data;

  socket.on("conversation:join", async (payload: unknown) => {
    try {
      const { conversationId } = conversationRoomSocketSchema.parse(payload);
      await chatService.getConversationOrThrow(conversationId, userId);
      await socket.join(SOCKET_CONSTANTS.conversationRoom(conversationId));
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("conversation:leave", async (payload: unknown) => {
    try {
      const { conversationId } = conversationRoomSocketSchema.parse(payload);
      await socket.leave(SOCKET_CONSTANTS.conversationRoom(conversationId));
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("message:send", async (payload: unknown) => {
    try {
      const input = sendMessageSocketSchema.parse(payload);
      const result = await chatService.sendMessage(userId, input);

      const eventBody = {
        message: result.message,
        conversationId: result.conversationId,
        isNewConversation: result.isNewConversation,
      };

      // Delivered via each participant's personal room — reaches every
      // device/tab they have open, regardless of whether they've explicitly
      // joined this conversation's room (e.g. they're on the conversations
      // list, not the chat screen itself).
      io.to(SOCKET_CONSTANTS.userRoom(result.senderId)).to(SOCKET_CONSTANTS.userRoom(result.receiverId)).emit(
        "message:receive",
        eventBody
      );

      // "Delivered" here means "the recipient had an active connection at
      // send time" — there's no separate persisted delivery state (the
      // Message model only tracks `isRead`), so this is a live-only signal
      // back to the sender, not something a client can fetch later via REST.
      if (onlineUsersRegistry.isOnline(result.receiverId)) {
        io.to(SOCKET_CONSTANTS.userRoom(result.senderId)).emit("message:delivered", {
          conversationId: result.conversationId,
          messageId: result.message.id,
        });
      }
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("typing:start", async (payload: unknown) => {
    try {
      const { conversationId } = conversationRoomSocketSchema.parse(payload);
      const conversation = await chatService.getConversationOrThrow(conversationId, userId);
      const otherUserId = chatService.otherParticipantId(conversation, userId);
      io.to(SOCKET_CONSTANTS.userRoom(otherUserId)).emit("typing:start", { conversationId, userId });
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("typing:stop", async (payload: unknown) => {
    try {
      const { conversationId } = conversationRoomSocketSchema.parse(payload);
      const conversation = await chatService.getConversationOrThrow(conversationId, userId);
      const otherUserId = chatService.otherParticipantId(conversation, userId);
      io.to(SOCKET_CONSTANTS.userRoom(otherUserId)).emit("typing:stop", { conversationId, userId });
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("message:read", async (payload: unknown) => {
    try {
      const { conversationId } = markReadSocketSchema.parse(payload);
      const result = await chatService.markConversationRead(conversationId, userId);

      if (result.updatedCount > 0) {
        io.to(SOCKET_CONSTANTS.userRoom(result.otherParticipantId)).emit("message:read", {
          conversationId: result.conversationId,
          readByUserId: result.readerId,
          updatedCount: result.updatedCount,
        });
      }
    } catch (err) {
      emitError(socket, err);
    }
  });

  // ---------------- Group chat socket handlers ------------------
  socket.on("chat_room:join", async (payload: unknown) => {
    try {
      const { chatId } = groupRoomSocketSchema.parse(payload);
      await chatService.getGroupOrThrow(chatId, userId);
      await socket.join(SOCKET_CONSTANTS.chatRoom(chatId));
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("chat_room:leave", async (payload: unknown) => {
    try {
      const { chatId } = groupRoomSocketSchema.parse(payload);
      await socket.leave(SOCKET_CONSTANTS.chatRoom(chatId));
    } catch (err) {
      emitError(socket, err);
    }
  });

  socket.on("group:message:send", async (payload: unknown) => {
    try {
      const parsed = groupRoomSocketSchema.parse(payload as any);
      const { chatId } = parsed;
      const body = payload as any;
      if (!body || typeof body.content !== "string" || body.content.trim().length === 0) {
        throw ApiError.badRequest("Message content is required.");
      }
      // ensure membership
      await chatService.getGroupOrThrow(chatId, userId);
      const created = await chatService.sendGroupMessage(userId, chatId, body.content);

      const eventBody = { message: {
        id: created.id,
        chatRoomId: created.chatRoomId,
        senderId: created.senderId,
        content: created.content,
        messageType: created.messageType,
        isRead: created.isRead,
        createdAt: created.createdAt,
      }, chatId };

      // broadcast to room
      io.to(SOCKET_CONSTANTS.chatRoom(chatId)).emit("new_group_message", eventBody);

      // also emit a lightweight notification to each member's personal room
      await chatService.listGroupsForUser(userId); // unused but kept for potential future expansion
      io.to(SOCKET_CONSTANTS.userRoom(userId)).emit("message:sent", eventBody);

      // global notification event for push/in-app
      io.emit("new_chat_message", { sender: userId, messagePreview: (created.content || ""), chatId });
    } catch (err) {
      emitError(socket, err);
    }
  });
}

