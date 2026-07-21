import { z } from "zod";

const skillsArray = z
  .array(z.string().trim().min(1, "Skill cannot be empty").max(50, "Skill must be at most 50 characters"))
  .max(20, "You can list at most 20 skills");

const learningInterestsArray = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Learning interest cannot be empty")
      .max(50, "Learning interest must be at most 50 characters")
  )
  .max(20, "You can list at most 20 learning interests");

export const updateStudentProfileSchema = z
  .object({
    department: z.string().trim().min(2, "Department must be at least 2 characters").max(100).optional(),
    level: z.string().trim().min(1, "Level is required").max(50).optional(),
    skills: skillsArray.optional(),
    learningInterests: learningInterestsArray.optional(),
    bio: z.string().trim().max(500, "Bio must be at most 500 characters").optional(),
    availability: z.string().trim().max(200, "Availability must be at most 200 characters").optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
