import type { Request, Response } from "express";
import { studentDiscoveryService } from "../services/studentDiscovery.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { RecommendationsQuery, SearchStudentsQuery } from "../validators/student.validator";

export const studentDiscoveryController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    // validateRequest already replaced req.query with the parsed/coerced
    // object at runtime; Express's built-in Request typing constrains
    // req.query to ParsedQs (string-only values) statically, so we cast
    // here rather than fight that generic — the shape is guaranteed by the
    // Zod schema on this route.
    const query = req.query as unknown as SearchStudentsQuery;
    const { students, pagination } = await studentDiscoveryService.searchStudents(query);
    // Nested `data` on purpose: the outer `data` is this API's standard
    // response envelope key (see ApiResponse.ts); the inner `data` + the
    // `pagination` sibling match the exact paginated-list shape from the
    // Phase 4 spec. See README "Design decisions" for the full rationale.
    sendSuccess(res, {
      message: "Students retrieved successfully.",
      data: { data: students, pagination },
    });
  }),

  recommendations: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const query = req.query as unknown as RecommendationsQuery;
    const recommendations = await studentDiscoveryService.getRecommendations(req.user.id, query.limit);
    sendSuccess(res, { message: "Recommendations retrieved successfully.", data: recommendations });
  }),
};
