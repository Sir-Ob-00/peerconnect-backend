// Augments Express's Request type so `req.user` is recognized project-wide
// once auth middleware starts attaching it in Phase 2. Left optional and
// unused for now — no auth logic exists yet in Phase 1.
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "STUDENT" | "ADMIN";
      };
    }
  }
}

export {};
