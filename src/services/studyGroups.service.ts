import { ApiError } from "../utils/ApiError";
import { chatRoomRepository } from "../repositories/chatRoom.repository";
import { chatMemberRepository } from "../repositories/chatMember.repository";
import { chatMessageRepository } from "../repositories/chatMessage.repository";

export const studyGroupsService = {
  async listAllGroups(_search?: string, page = 1, limit = 10) {
    const rooms = await chatRoomRepository.findMany();
    const totalItems = rooms.length;
    const start = (page - 1) * limit;
    const paginated = rooms.slice(start, start + limit);

    return {
      data: paginated.map((r: any) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        description: r.description,
        imageUrl: r.imageUrl,
        createdById: r.createdById,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async getGroupById(id: string) {
    const room = await chatRoomRepository.findByIdWithMembers(id);
    if (!room) throw ApiError.notFound("Study group not found.");

    return {
      id: room.id,
      type: room.type,
      name: room.name,
      description: room.description,
      imageUrl: room.imageUrl,
      createdById: room.createdById,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      members: room.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
        joinedAt: m.joinedAt,
      })),
    };
  },

  async deleteGroup(id: string) {
    const room = await chatRoomRepository.findById(id);
    if (!room) throw ApiError.notFound("Study group not found.");
    return chatRoomRepository.delete(id);
  },

  async getGroupMembers(chatRoomId: string) {
    const room = await chatRoomRepository.findById(chatRoomId);
    if (!room) throw ApiError.notFound("Study group not found.");

    const members = await chatMemberRepository.listMembers(chatRoomId);
    return members;
  },

  async removeMember(chatRoomId: string, userId: string) {
    const room = await chatRoomRepository.findById(chatRoomId);
    if (!room) throw ApiError.notFound("Study group not found.");

    await chatMemberRepository.removeMember(chatRoomId, userId);
    return { success: true };
  },

  async getGroupMessages(chatRoomId: string, page = 1, limit = 20) {
    const room = await chatRoomRepository.findById(chatRoomId);
    if (!room) throw ApiError.notFound("Study group not found.");

    const skip = (page - 1) * limit;
    const result = await chatMessageRepository.listByChatRoom({ chatRoomId, skip, take: limit });

    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },
};
