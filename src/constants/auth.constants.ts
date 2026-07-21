/**
 * Central place for magic numbers/strings used across the auth module, so
 * changing a rule (e.g. password policy) doesn't mean hunting through
 * services and validators separately.
 */
export const AUTH_CONSTANTS = {
  /** bcrypt cost factor — pulled from env so it can be tuned per environment. */
  PASSWORD_MIN_LENGTH: 8,

  /** Prefix used on Authorization headers: "Bearer <token>". */
  BEARER_PREFIX: "Bearer ",

  /** How long a plaintext password-reset token stays valid before expiry. */
  RESET_TOKEN_BYTES: 32,

  /** How long a plaintext refresh-token identifier is, in random bytes, before hashing. */
  REFRESH_TOKEN_BYTES: 40,
} as const;

/** Regex enforcing: 8+ chars, at least one uppercase, lowercase, digit, and special character. */
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
