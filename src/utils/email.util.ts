import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

/**
 * Checks whether the provided email matches one of the allowed university domains
 * configured in ALLOWED_UNIVERSITY_DOMAINS (comma-separated list). Throws
 * ApiError.badRequest if validation fails.
 */
export function validateUniversityEmailOrThrow(email: string): void {
  const domainsRaw = env.ALLOWED_UNIVERSITY_DOMAINS ?? "";
  const domains = domainsRaw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (domains.length === 0) {
    // If no domains configured, be conservative and reject.
    throw ApiError.badRequest("Only university student emails are allowed");
  }

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) throw ApiError.badRequest("Only university student emails are allowed");
  const domain = email.slice(atIndex + 1).toLowerCase();

  const isAllowed = domains.some((d) => domain === d || domain.endsWith(`.${d}`));
  if (!isAllowed) throw ApiError.badRequest("Only university student emails are allowed");
}
