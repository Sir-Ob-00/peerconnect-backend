import { conversationRepository, type ConversationWithParticipants } from "../repositories/conversation.repository";
import { messageRepository } from "../repositories/message.repository";
import { userRepository } from "../repositories/user.repository";
import { notificationService } from "./notification.service";
import { toPaginationMeta, type PaginationMeta } from "../dtos/studentDiscovery.dto";
import { toConversationListItem, toMessageView, type ConversationListItem, type MessageView } from "../dtos/chat.dto";
import { ApiError } from "../utils/ApiError";
import { chatRoomRepository } from "../repositories/chatRoom.repository";
import { chatMemberRepository } from "../repositories/chatMember.repository";
import { chatMessageRepository } from "../repositories/chatMessage.repository";

export interface SendMessageInput {
  conversationId?: string;
  receiverId?: string;
  content?: string;
  imageUrl?: string;
}

export interface SendMessageResult {
  message: MessageView;
  conversationId: string;
  senderId: string;
  receiverId: string;
  /** True if this call created a brand-new conversation — lets the caller (e.g. socket layer) tell clients to refresh their conversation list. */
  isNewConversation: boolean;
}

export interface MarkReadResult {
  conversationId: string;
  readerId: string;
  otherParticipantId: string;
  updatedCount: number;
}

function assertParticipant(conversation: { userOneId: string; userTwoId: string }, userId: string): void {
  if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
    throw ApiError.forbidden("You are not a participant in this conversation.");
  }
}

function otherParticipantId(conversation: { userOneId: string; userTwoId: string }, userId: string): string {
  return conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;
}

export const chatService = {
  async listConversations(userId: string): Promise<ConversationListItem[]> {
    const conversations = await conversationRepository.listForUser(userId);

    const withUnreadCounts = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await messageRepository.countUnread(conversation.id, userId);
        return toConversationListItem(conversation, userId, unreadCount);
      })
    );

    // Sorted by most recent activity (last message, falling back to conversation
    // creation time for a brand-new empty conversation) rather than by when the
    // conversation row itself was created — this is deliberately done in
    // application code rather than a DB `orderBy` on a related record's field,
    // to avoid a denormalized "lastMessageAt" column for what's expected to be
    // a small, boundable per-user list.
    return withUnreadCounts.sort((a, b) => {
      const aTime = (a.lastMessage?.createdAt ?? a.createdAt).getTime();
      const bTime = (b.lastMessage?.createdAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  },

  async listMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ messages: MessageView[]; pagination: PaginationMeta }> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found.");
    }
    assertParticipant(conversation, userId);

    const { items, totalItems } = await messageRepository.listByConversation({
      conversationId,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { messages: items.map(toMessageView), pagination: toPaginationMeta(page, limit, totalItems) };
  },

  /** Looks up (or lazily creates) the 1:1 conversation between two users, validating the other user actually exists. */
  async getOrCreateConversation(userAId: string, userBId: string): Promise<{ conversation: ConversationWithParticipants; isNew: boolean }> {
    if (userAId === userBId) {
      throw ApiError.badRequest("You cannot start a conversation with yourself.");
    }

    const existing = await conversationRepository.findBetweenUsers(userAId, userBId);
    if (existing) {
      return { conversation: existing, isNew: false };
    }

    const otherUser = await userRepository.findActiveById(userBId);
    if (!otherUser) {
      throw ApiError.notFound("The student you're trying to message was not found.");
    }

    const created = await conversationRepository.create(userAId, userBId);
    return { conversation: created, isNew: true };
  },

  async sendMessage(senderId: string, input: SendMessageInput): Promise<SendMessageResult> {
    let conversation: ConversationWithParticipants;
    let isNewConversation = false;

    if (input.conversationId) {
      const found = await conversationRepository.findById(input.conversationId);
      if (!found) {
        throw ApiError.notFound("Conversation not found.");
      }
      assertParticipant(found, senderId);
      conversation = found;
    } else if (input.receiverId) {
      const result = await chatService.getOrCreateConversation(senderId, input.receiverId);
      conversation = result.conversation;
      isNewConversation = result.isNew;
    } else {
      // Unreachable if the caller validated with sendMessageSocketSchema first, but kept as a safety net.
      throw ApiError.badRequest("Provide either conversationId or receiverId.");
    }

    if (!input.content && !input.imageUrl) {
      throw ApiError.badRequest("Provide message content, an image, or both.");
    }

    const created = await messageRepository.create({
      conversationId: conversation.id,
      senderId,
      content: input.content,
      imageUrl: input.imageUrl,
    });

    const receiverId = otherParticipantId(conversation, senderId);
    const sender = conversation.userOneId === senderId ? conversation.userOne : conversation.userTwo;
    const senderName = `${sender.firstName} ${sender.lastName}`;
    const preview =
      input.content && input.content.length > 100 ? `${input.content.slice(0, 100)}…` : input.content;

    // In-app + real-time only (no email — see notification.service.ts's
    // doc comment on why CHAT_MESSAGE deliberately doesn't email). Created
    // for every message, same as the spec's CHAT_MESSAGE type implies;
    // deliberately not debounced/deduped (e.g. "only if recipient is
    // offline") to keep this phase's implementation simple, as instructed.
    await notificationService.createNotification({
      userId: receiverId,
      title: "New message",
      message: preview ? `${senderName}: ${preview}` : `${senderName} sent you an image.`,
      type: "CHAT_MESSAGE",
    });

    return {
      message: toMessageView(created),
      conversationId: conversation.id,
      senderId,
      receiverId,
      isNewConversation,
    };
  },

  async markConversationRead(conversationId: string, readerId: string): Promise<MarkReadResult> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found.");
    }
    assertParticipant(conversation, readerId);

    const { count } = await messageRepository.markConversationRead(conversationId, readerId);

    return {
      conversationId,
      readerId,
      otherParticipantId: otherParticipantId(conversation, readerId),
      updatedCount: count,
    };
  },

  /** Exposed for the socket layer's typing-indicator relay, which needs to know who to notify without touching messages. */
  async getConversationOrThrow(conversationId: string, userId: string): Promise<ConversationWithParticipants> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found.");
    }
    assertParticipant(conversation, userId);
    return conversation;
  },

  // ------------------------- Group chat support ---------------------------
  async createGroup(creatorId: string, input: { name: string; description?: string; imageUrl?: string; members?: string[] }) {
    if (!input.name || input.name.trim().length === 0) {
      throw ApiError.badRequest("Group name is required.");
    }
    const created = await chatRoomRepository.create({ type: "GROUP", name: input.name.trim(), description: input.description ?? null, imageUrl: input.imageUrl ?? null, createdById: creatorId });

    // creator becomes admin
    await chatMemberRepository.addMember(created.id, creatorId, "ADMIN");

    // add other members as MEMBER
    const memberIds = Array.isArray(input.members) ? input.members : [];
    for (const m of memberIds) {
      if (m === creatorId) continue;
      // ensure user exists
      const user = await userRepository.findActiveById(m);
      if (!user) continue; // silently skip unknown ids
      try {
        await chatMemberRepository.addMember(created.id, m, "MEMBER");
      } catch (err) {
        // ignore duplicates
      }
    }

    return await chatRoomRepository.findByIdWithMembers(created.id);
  },

  async listGroupsForUser(userId: string) {
    const rooms = await chatRoomRepository.listForUser(userId);
    return rooms;
  },

  async getGroupOrThrow(chatRoomId: string, userId: string) {
    const room = await chatRoomRepository.findByIdWithMembers(chatRoomId);
    if (!room) throw ApiError.notFound("Chat room not found.");
    const isMember = room.members.some((m: any) => m.user.id === userId);
    if (!isMember) throw ApiError.forbidden("You are not a member of this chat room.");
    return room;
  },

  async addGroupMembers(chatRoomId: string, actorId: string, memberIds: string[]) {
    // ensure actor is admin
    const member = await chatMemberRepository.findMember(chatRoomId, actorId);
    if (!member || member.role !== "ADMIN") throw ApiError.forbidden("Only group admins can add members.");

    const added: any[] = [];
    for (const id of memberIds) {
      const user = await userRepository.findActiveById(id);
      if (!user) continue;
      try {
        const created = await chatMemberRepository.addMember(chatRoomId, id, "MEMBER");
        added.push(created);
      } catch (err) {
        // ignore unique constraint
      }
    }
    return added;
  },

  async removeGroupMember(chatRoomId: string, actorId: string, userIdToRemove: string) {
    const actor = await chatMemberRepository.findMember(chatRoomId, actorId);
    if (!actor || actor.role !== "ADMIN") throw ApiError.forbidden("Only group admins can remove members.");
    if (actorId === userIdToRemove) throw ApiError.badRequest("Admin cannot remove themselves; use leave endpoint or transfer admin first.");

    await chatMemberRepository.removeMember(chatRoomId, userIdToRemove);
    return { success: true };
  },

  async updateGroup(chatRoomId: string, actorId: string, data: { name?: string; description?: string; imageUrl?: string }) {
    const actor = await chatMemberRepository.findMember(chatRoomId, actorId);
    if (!actor || actor.role !== "ADMIN") throw ApiError.forbidden("Only group admins can update the group.");
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    const updated = await chatRoomRepository.update(chatRoomId, updateData as any);
    return updated;
  },

  async leaveGroup(chatRoomId: string, userId: string) {
    const member = await chatMemberRepository.findMember(chatRoomId, userId);
    if (!member) throw ApiError.notFound("You are not a member of this group.");
    if (member.role === "ADMIN") {
      const adminCount = await chatMemberRepository.countAdmins(chatRoomId);
      if (adminCount <= 1) {
        throw ApiError.badRequest("Cannot leave group as the last admin. Promote another admin before leaving.");
      }
    }
    await chatMemberRepository.removeMember(chatRoomId, userId);
    return { success: true };
  },

  async sendGroupMessage(senderId: string, chatRoomId: string, content?: string) {
    if (!content || content.trim().length === 0) throw ApiError.badRequest("Message content is required.");
    const member = await chatMemberRepository.findMember(chatRoomId, senderId);
    if (!member) throw ApiError.forbidden("You are not a member of this group.");

    const created = await chatMessageRepository.create({ chatRoomId, senderId, content, messageType: "TEXT" });

    // notify other members
    const members = await chatMemberRepository.listMembers(chatRoomId);
    const senderUser = await userRepository.findActiveById(senderId);
    const preview = content.length > 100 ? `${content.slice(0, 100)}…` : content;
    const promises = members
      .filter((m) => m.userId !== senderId)
      .map((m) =>
        notificationService.createNotification({
          userId: m.userId,
          title: `New group message in ${member.chatRoomId}`,
          message: senderUser ? `${senderUser.firstName} ${senderUser.lastName}: ${preview}` : preview,
          type: "CHAT_MESSAGE",
        })
      );
    await Promise.all(promises);

    return created;
  },

  async listGroupMessages(chatRoomId: string, userId: string, page: number, limit: number) {
    const isMember = await chatMemberRepository.findMember(chatRoomId, userId);
    if (!isMember) throw ApiError.forbidden("You are not a member of this chat room.");
    const { items, totalItems } = await chatMessageRepository.listByChatRoom({ chatRoomId, skip: (page - 1) * limit, take: limit });
    return { messages: items, pagination: toPaginationMeta(page, limit, totalItems) };
  },

  otherParticipantId,
};
