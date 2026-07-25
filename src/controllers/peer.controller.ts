import type { Request, Response } from "express";
import { peerService } from "../services/peer.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  PeersQuery,
  RecommendedPeersQuery,
  ConnectionRequestInput,
  ConnectionActionInput,
  PeerIdParam,
  BlockUserInput,
} from "../validators/peer.validator";

export const peerController = {
  getRecommended: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const query = req.query as unknown as RecommendedPeersQuery;
    const result = await peerService.getRecommendedPeers(req.user.id, query.page, query.limit);
    sendSuccess(res, { message: "Recommended peers retrieved.", data: result });
  }),

  searchPeers: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const query = req.query as unknown as PeersQuery;
    const result = await peerService.searchPeers(req.user.id, query);
    sendSuccess(res, { message: "Peers retrieved.", data: result });
  }),

  getPeerProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { userId } = req.params as PeerIdParam;
    const profile = await peerService.getPeerProfile(req.user.id, userId);
    if (!profile) {
      throw ApiError.notFound("Peer not found.");
    }
    sendSuccess(res, { message: "Peer profile retrieved.", data: profile });
  }),

  listConnections: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const connections = await peerService.listConnections(req.user.id);
    sendSuccess(res, { message: "Connections retrieved.", data: connections });
  }),

  sendConnectionRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as ConnectionRequestInput;
    const result = await peerService.requestConnection(req.user.id, body.userId);
    sendSuccess(res, { message: "Connection request sent.", data: result, statusCode: 201 });
  }),

  acceptConnection: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as ConnectionActionInput;
    const result = await peerService.acceptConnection(req.user.id, body.connectionId);
    sendSuccess(res, { message: "Connection accepted.", data: result });
  }),

  rejectConnection: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as ConnectionActionInput;
    const result = await peerService.rejectConnection(req.user.id, body.connectionId);
    sendSuccess(res, { message: "Connection rejected.", data: result });
  }),

  removeConnection: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as ConnectionActionInput;
    await peerService.removeConnection(req.user.id, body.connectionId);
    sendSuccess(res, { message: "Connection removed." });
  }),

  blockUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as BlockUserInput;
    await peerService.blockUser(req.user.id, body.userId, body.reason);
    sendSuccess(res, { message: "User blocked." });
  }),

  unblockUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as BlockUserInput;
    await peerService.unblockUser(req.user.id, body.userId);
    sendSuccess(res, { message: "User unblocked." });
  }),
};
