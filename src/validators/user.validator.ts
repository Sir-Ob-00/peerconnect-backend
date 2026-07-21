import { z } from "zod";

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`);

/** All fields optional — this is a partial update endpoint (PATCH /users/me). */
export const updateMeSchema = z
  .object({
    firstName: nameField("First name").optional(),
    lastName: nameField("Last name").optional(),
    profileImage: z.string().url("Profile image must be a valid URL").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
