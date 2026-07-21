import { z } from "zod";

/** For any future route with a URL param like /users/:id — kept here so it's not redefined per feature. */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
});
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
