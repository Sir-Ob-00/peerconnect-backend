import { z } from "zod";

export const updateAcademicProfileSchema = z.object({
  universityId: z.string().min(1, "University is required"),
  departmentId: z.string().optional(),
  levelId: z.string().optional(),
  programmeId: z.string().optional(),
});

export type UpdateAcademicProfileInput = z.infer<typeof updateAcademicProfileSchema>;

export const studyPreferenceSchema = z.object({
  wantsToLearnCourses: z.boolean(),
  wantsToLearnSkills: z.boolean(),
}).refine((data) => data.wantsToLearnCourses || data.wantsToLearnSkills, {
  message: "Select at least one study type",
  path: ["wantsToLearnCourses"],
});

export type StudyPreferenceInput = z.infer<typeof studyPreferenceSchema>;

export const courseSelectionSchema = z.object({
  courseIds: z.array(z.string().uuid("Invalid course ID")).max(20, "You can select at most 20 courses").optional(),
});

export type CourseSelectionInput = z.infer<typeof courseSelectionSchema>;

export const customCourseSchema = z.object({
  name: z.string().trim().min(2, "Course name must be at least 2 characters").max(100, "Course name must be at most 100 characters"),
  code: z.string().trim().max(20, "Code must be at most 20 characters").optional(),
  departmentId: z.string().uuid().optional(),
  levelId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
});

export type CustomCourseInput = z.infer<typeof customCourseSchema>;

export const skillSelectionSchema = z.object({
  skillIds: z.array(z.string().uuid("Invalid skill ID")).max(20, "You can select at most 20 skills").optional(),
});

export type SkillSelectionInput = z.infer<typeof skillSelectionSchema>;

export const customSkillSchema = z.object({
  name: z.string().trim().min(2, "Skill name must be at least 2 characters").max(50, "Skill name must be at most 50 characters"),
  programmeId: z.string().uuid().optional(),
});

export type CustomSkillInput = z.infer<typeof customSkillSchema>;

export const courseIdSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
});

export type CourseIdInput = z.infer<typeof courseIdSchema>;

export const skillIdSchema = z.object({
  skillId: z.string().uuid("Invalid skill ID"),
});

export type SkillIdInput = z.infer<typeof skillIdSchema>;

export const helpSelectionSchema = z.object({
  courseIds: z.array(z.string().uuid("Invalid course ID")).optional(),
  skillIds: z.array(z.string().uuid("Invalid skill ID")).optional(),
});

export type HelpSelectionInput = z.infer<typeof helpSelectionSchema>;

export const learningInterestsSchema = z.object({
  interestIds: z.array(z.string().uuid("Invalid interest ID")).max(10, "You can select at most 10 interests").optional(),
});

export type LearningInterestsInput = z.infer<typeof learningInterestsSchema>;

export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format"),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format").optional(),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

export const updateBioSchema = z.object({
  bio: z.string().trim().max(200, "Bio must be at most 200 characters").optional(),
});

export type UpdateBioInput = z.infer<typeof updateBioSchema>;

export interface OnboardingStatusDTO {
  currentStep: string;
  completedSteps: string[];
  requiredIncomplete: string[];
  canProceedToIdVerification: boolean;
}
