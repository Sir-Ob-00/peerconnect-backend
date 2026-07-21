import type { Request, Response } from "express";
import { healthService } from "../services/health.service";
import { sendSuccess } from "../utils/ApiResponse";

export const healthController = {
  getHealth(_req: Request, res: Response): void {
    const { message } = healthService.getStatus();
    sendSuccess(res, { message });
  },
};
