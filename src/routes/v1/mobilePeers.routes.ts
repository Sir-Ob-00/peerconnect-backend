import { Router } from "express";
import { peerController } from "../../controllers/peer.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  peersQuerySchema,
  recommendedPeersQuerySchema,
  connectionRequestSchema,
  connectionActionSchema,
  peerIdParamSchema,
  blockUserSchema,
} from "../../validators/peer.validator";

export const mobilePeersRouter = Router();

mobilePeersRouter.use(authenticate);

mobilePeersRouter.get(
  "/peers/recommended",
  validateRequest({ query: recommendedPeersQuerySchema }),
  peerController.getRecommended
);

mobilePeersRouter.get(
  "/peers/connections",
  peerController.listConnections
);

mobilePeersRouter.post(
  "/peers/connections/request",
  validateRequest({ body: connectionRequestSchema }),
  peerController.sendConnectionRequest
);

mobilePeersRouter.post(
  "/peers/connections/accept",
  validateRequest({ body: connectionActionSchema }),
  peerController.acceptConnection
);

mobilePeersRouter.post(
  "/peers/connections/reject",
  validateRequest({ body: connectionActionSchema }),
  peerController.rejectConnection
);

mobilePeersRouter.delete(
  "/peers/connections/:connectionId",
  validateRequest({ params: connectionActionSchema }),
  peerController.removeConnection
);

mobilePeersRouter.post("/peers/block", validateRequest({ body: blockUserSchema }), peerController.blockUser);

mobilePeersRouter.post("/peers/unblock", validateRequest({ body: blockUserSchema }), peerController.unblockUser);

mobilePeersRouter.get(
  "/peers",
  validateRequest({ query: peersQuerySchema }),
  peerController.searchPeers
);

mobilePeersRouter.get(
  "/peers/:userId",
  validateRequest({ params: peerIdParamSchema }),
  peerController.getPeerProfile
);
