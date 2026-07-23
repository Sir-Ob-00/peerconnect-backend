import type { Request, Response } from "express";
import { onboardingService } from "../services/onboarding.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

export const onboardingController = {
  getAcademicProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getAcademicProfile(req.user.id);
    sendSuccess(res, { message: "Academic profile retrieved.", data });
  }),

  getUniversities: asyncHandler(async (_req: Request, res: Response) => {
    const data = await onboardingService.getUniversities();
    sendSuccess(res, { message: "Universities retrieved.", data });
  }),

  getDepartments: asyncHandler(async (req: Request, res: Response) => {
    const { universityId, search } = req.query as { universityId?: string; search?: string };
    const data = await onboardingService.getDepartments(universityId, search);
    sendSuccess(res, { message: "Departments retrieved.", data });
  }),

  createCustomDepartment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { name, universityId } = req.body as { name: string; universityId: string };
    const data = await onboardingService.createCustomDepartment(req.user.id, name, universityId);
    sendSuccess(res, { message: "Custom department created.", data });
  }),

  getLevels: asyncHandler(async (_req: Request, res: Response) => {
    const data = await onboardingService.getLevels();
    sendSuccess(res, { message: "Levels retrieved.", data });
  }),

  getProgrammes: asyncHandler(async (req: Request, res: Response) => {
    const { universityId, departmentId } = req.query as { universityId?: string; departmentId?: string };
    const data = await onboardingService.getProgrammes(universityId, departmentId);
    sendSuccess(res, { message: "Programmes retrieved.", data });
  }),

  updateAcademicProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.updateAcademicProfile(req.user.id, req.body);
    sendSuccess(res, { message: "Academic profile updated.", data });
  }),

  uploadProfilePhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const profile = await onboardingService.uploadProfilePhoto(req.user.id, req.file);
    sendSuccess(res, { message: "Profile photo uploaded.", data: profile });
  }),

  getStudyPreferences: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getStudyPreferences(req.user.id);
    sendSuccess(res, { message: "Study preferences retrieved.", data });
  }),

  updateStudyPreferences: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.updateStudyPreferences(req.user.id, req.body);
    sendSuccess(res, { message: "Study preferences updated.", data });
  }),

  searchCourses: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
    const data = await onboardingService.searchCourses({
      search: query.search as string | undefined,
      universityId: query.universityId as string | undefined,
      departmentId: query.departmentId as string | undefined,
      levelId: query.levelId as string | undefined,
      programmeId: query.programmeId as string | undefined,
      page,
      limit,
    });
    sendSuccess(res, { message: "Courses retrieved.", data });
  }),

  createCustomCourse: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.createCustomCourse(req.user.id, req.body);
    sendSuccess(res, { message: "Custom course created.", data });
  }),

  getLearningCourses: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getLearningCourses(req.user.id);
    sendSuccess(res, { message: "Learning courses retrieved.", data });
  }),

  addLearningCourse: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { courseId } = req.body as { courseId: string };
    const data = await onboardingService.addLearningCourse(req.user.id, courseId);
    sendSuccess(res, { message: "Course added to learning list.", data });
  }),

  removeLearningCourse: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { courseId } = req.params as { courseId: string };
    await onboardingService.removeLearningCourse(req.user.id, courseId);
    sendSuccess(res, { message: "Course removed from learning list." });
  }),

  searchSkills: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
    const data = await onboardingService.searchSkills(query.search as string | undefined, query.programmeId as string | undefined, page, limit);
    sendSuccess(res, { message: "Skills retrieved.", data });
  }),

  createCustomSkill: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { name, programmeId } = req.body as { name: string; programmeId?: string };
    const data = await onboardingService.createCustomSkill(req.user.id, name, programmeId);
    sendSuccess(res, { message: "Custom skill created.", data });
  }),

  getLearningSkills: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getLearningSkills(req.user.id);
    sendSuccess(res, { message: "Learning skills retrieved.", data });
  }),

  addLearningSkill: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { skillId } = req.body as { skillId: string };
    const data = await onboardingService.addLearningSkill(req.user.id, skillId);
    sendSuccess(res, { message: "Skill added to learning list.", data });
  }),

  removeLearningSkill: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { skillId } = req.params as { skillId: string };
    await onboardingService.removeLearningSkill(req.user.id, skillId);
    sendSuccess(res, { message: "Skill removed from learning list." });
  }),

  getHelpCourses: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getHelpCourses(req.user.id);
    sendSuccess(res, { message: "Help courses retrieved.", data });
  }),

  addHelpCourse: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { courseId } = req.body as { courseId: string };
    const data = await onboardingService.addHelpCourse(req.user.id, courseId);
    sendSuccess(res, { message: "Course added to help list.", data });
  }),

  removeHelpCourse: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { courseId } = req.params as { courseId: string };
    await onboardingService.removeHelpCourse(req.user.id, courseId);
    sendSuccess(res, { message: "Course removed from help list." });
  }),

  getHelpSkills: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getHelpSkills(req.user.id);
    sendSuccess(res, { message: "Help skills retrieved.", data });
  }),

  addHelpSkill: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { skillId } = req.body as { skillId: string };
    const data = await onboardingService.addHelpSkill(req.user.id, skillId);
    sendSuccess(res, { message: "Skill added to help list.", data });
  }),

  removeHelpSkill: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { skillId } = req.params as { skillId: string };
    await onboardingService.removeHelpSkill(req.user.id, skillId);
    sendSuccess(res, { message: "Skill removed from help list." });
  }),

  getLearningInterests: asyncHandler(async (_req: Request, res: Response) => {
    const data = await onboardingService.getLearningInterests();
    sendSuccess(res, { message: "Learning interests retrieved.", data });
  }),

  getUserLearningInterests: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getUserLearningInterests(req.user.id);
    sendSuccess(res, { message: "My learning interests retrieved.", data });
  }),

  setLearningInterests: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.setLearningInterests(req.user.id, req.body);
    sendSuccess(res, { message: "Learning interests updated.", data });
  }),

  getAvailability: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getAvailability(req.user.id);
    sendSuccess(res, { message: "Availability retrieved.", data });
  }),

  addAvailability: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.addAvailability(req.user.id, req.body);
    sendSuccess(res, { message: "Availability slot added.", data });
  }),

  updateAvailability: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { availabilityId } = req.params as { availabilityId: string };
    const data = await onboardingService.updateAvailability(req.user.id, availabilityId, req.body);
    sendSuccess(res, { message: "Availability slot updated.", data });
  }),

  removeAvailability: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { availabilityId } = req.params as { availabilityId: string };
    await onboardingService.removeAvailability(req.user.id, availabilityId);
    sendSuccess(res, { message: "Availability slot removed." });
  }),

  updateBio: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.updateBio(req.user.id, req.body);
    sendSuccess(res, { message: "Bio updated.", data });
  }),

  getOnboardingStatus: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const data = await onboardingService.getOnboardingStatus(req.user.id);
    sendSuccess(res, { message: "Onboarding status retrieved.", data });
  }),
};
