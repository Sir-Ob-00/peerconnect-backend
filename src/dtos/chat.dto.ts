import type { Message, User } from "@prisma/client";
import type { ConversationWithLastMessage } from "../repositories/conversation.repository";

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function toMessageView(message: Message): MessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    imageUrl: message.imageUrl,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

function toParticipant(user: Pick<User, "id" | "firstName" | "lastName" | "profileImage">): ChatParticipant {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage };
}

export interface ConversationListItem {
  id: string;
  participant: ChatParticipant;
  lastMessage: MessageView | null;
  unreadCount: number;
  createdAt: Date;
}

export function toConversationListItem(
  conversation: ConversationWithLastMessage,
  currentUserId: string,
  unreadCount: number
): ConversationListItem {
  const other = conversation.userOneId === currentUserId ? conversation.userTwo : conversation.userOne;
  const lastMessage = conversation.messages[0];

  return {
    id: conversation.id,
    participant: toParticipant(other),
    lastMessage: lastMessage ? toMessageView(lastMessage) : null,
    unreadCount,
    createdAt: conversation.createdAt,
  };
}

// ChatRoom / Group DTOs
export interface ChatMemberView {
  id: string;
  role: string;
  joinedAt: Date;
  user: ChatParticipant;
}

export interface ChatRoomView {
  id: string;
  type: string;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdById: string;
  members: ChatMemberView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageView {
  id: string;
  chatRoomId: string;
  senderId: string;
  content?: string | null;
  messageType: string;
  isRead: boolean;
  createdAt: Date;
}

export function toChatMessageView(message: any): ChatMessageView {
  return {
    id: message.id,
    chatRoomId: message.chatRoomId,
    senderId: message.senderId,
    content: message.content,
    messageType: message.messageType,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

export function toChatRoomView(room: any): ChatRoomView {
  return {
    id: room.id,
    type: String(room.type),
    name: room.name,
    description: room.description,
    imageUrl: room.imageUrl,
    createdById: room.createdById,
    members: (room.members || []).map((m: any) => ({ id: m.id, role: m.role, joinedAt: m.joinedAt, user: toParticipant(m.user) })),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}
