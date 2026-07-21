import crypto from "crypto";
import type { User } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { passwordResetTokenRepository } from "../repositories/passwordResetToken.repository";
import { emailVerificationTokenRepository } from "../repositories/emailVerificationToken.repository";
import { comparePassword, hashPassword } from "../utils/password.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import { generateSecureToken, hashToken } from "../utils/token.util";
import { ApiError } from "../utils/ApiError";
import { toPublicUser, type PublicUser } from "../dtos/user.dto";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AUTH_CONSTANTS } from "../constants/auth.constants";
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../validators/auth.validator";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const INVALID_RESET_TOKEN_MESSAGE = "Invalid or expired reset token.";

/** Rejects login for any account state other than a fully active, non-deleted user. Called after credentials check. */
function assertAccountIsUsable(user: User): void {
  if (user.deletedAt) {
    throw ApiError.forbidden("This account has been deleted.");
  }
  if (user.accountStatus === "SUSPENDED") {
    throw ApiError.forbidden("Your account has been suspended. Please contact support.");
  }
  if (user.accountStatus === "INACTIVE") {
    throw ApiError.forbidden("Your account is inactive. Please contact support.");
  }
}

/** Issues a fresh access + refresh token pair and persists the refresh token's hash for later verification/revocation. */
async function issueTokens(user: User): Promise<AuthTokens> {
  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ userId: user.id, tokenId });

  await refreshTokenRepository.create({
    id: tokenId,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_MS),
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("Email is already registered.");
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: hashedPassword,
      // role defaults to STUDENT via the schema; registration never accepts a client-supplied role.
    });

    const tokens = await issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    // Only checked *after* the password matches, so a wrong password on a
    // suspended account still reports "invalid credentials" rather than
    // confirming the account exists and is suspended.
    assertAccountIsUsable(user);

    const tokens = await issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(refreshTokenRaw: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token.");
    }

    const storedToken = await refreshTokenRepository.findById(payload.jti);
    const isValidStoredToken =
      storedToken &&
      !storedToken.revokedAt &&
      storedToken.expiresAt.getTime() > Date.now() &&
      storedToken.tokenHash === hashToken(refreshTokenRaw);

    if (!isValidStoredToken) {
      throw ApiError.unauthorized("Invalid or expired refresh token.");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized("Invalid or expired refresh token.");
    }
    assertAccountIsUsable(user);

    // Rotate: the presented refresh token is single-use. Revoking it here
    // means a stolen-then-reused token is detectable (it'll already be revoked).
    await refreshTokenRepository.revoke(storedToken.id);

    return issueTokens(user);
  },

  async logout(refreshTokenRaw?: string): Promise<void> {
    if (!refreshTokenRaw) return;

    // Logout should never fail the request just because the token was
    // already invalid/expired/malformed — the client is leaving either way.
    try {
      const payload = verifyRefreshToken(refreshTokenRaw);
      const storedToken = await refreshTokenRepository.findById(payload.jti);
      if (storedToken && !storedToken.revokedAt) {
        await refreshTokenRepository.revoke(storedToken.id);
      }
    } catch {
      // Swallow — see comment above. A structured blacklist/deny-list table
      // (e.g. tracking used-but-not-yet-expired access token jtis) can be
      // layered in here later without changing this method's signature.
    }
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ resetToken?: string }> {
    const user = await userRepository.findActiveByEmail(input.email);

    // Deliberately do not reveal whether the email exists: respond the same
    // way either way. The token is only ever generated (and returned) for a
    // real account.
    if (!user) {
      return {};
    }

    await passwordResetTokenRepository.invalidateAllForUser(user.id);

    const { plainText, hash } = generateSecureToken(AUTH_CONSTANTS.RESET_TOKEN_BYTES);
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000),
    });

    // DEV/TESTING ONLY: the plaintext token is returned directly in the API
    // response so this flow is testable without an email provider wired up.
    // When Nodemailer/Email OTP is added, replace this return with an email
    // send and stop returning `resetToken` in the response body.
    return { resetToken: plainText };
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const resetToken = await passwordResetTokenRepository.findByTokenHash(tokenHash);

    const isValid = resetToken && !resetToken.usedAt && resetToken.expiresAt.getTime() > Date.now();
    if (!isValid) {
      throw ApiError.badRequest(INVALID_RESET_TOKEN_MESSAGE);
    }

    const user = await userRepository.findById(resetToken.userId);
    if (!user || user.deletedAt) {
      throw ApiError.badRequest(INVALID_RESET_TOKEN_MESSAGE);
    }

    const hashedPassword = await hashPassword(input.password);
    await userRepository.update(user.id, { password: hashedPassword });
    await passwordResetTokenRepository.markUsed(resetToken.id);

    // Password just changed — invalidate every existing session.
    await refreshTokenRepository.revokeAllForUser(user.id);
  },

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const currentMatches = await comparePassword(input.currentPassword, user.password);
    if (!currentMatches) {
      throw ApiError.unauthorized("Current password is incorrect.");
    }

    const hashedPassword = await hashPassword(input.newPassword);
    await userRepository.update(user.id, { password: hashedPassword });

    await refreshTokenRepository.revokeAllForUser(user.id);
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }
    return toPublicUser(user);
  },

  // --- Mobile-specific registration + email OTP verification ---
  async registerMobile(input: RegisterInput & { fullName?: string; university?: string; department?: string; level?: string }) {
    // Validate university email domain using reusable utility
    try {
      const { validateUniversityEmailOrThrow } = await import("../utils/email.util");
      validateUniversityEmailOrThrow(input.email);
    } catch (err) {
      throw ApiError.badRequest("Use your university email address");
    }

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("Email is already registered");
    }

    const hashedPassword = await hashPassword(input.password);
    let firstName = input.firstName ?? "";
    let lastName = input.lastName ?? "";
    if ((input as any).fullName && !firstName && !lastName) {
      const parts = (input as any).fullName.trim().split(/\s+/);
      firstName = parts.shift() ?? "";
      lastName = parts.join(" ") ?? "";
    }

    const user = await userRepository.create({
      firstName: firstName || input.firstName || "",
      lastName: lastName || input.lastName || "",
      email: input.email,
      password: hashedPassword,
      role: "STUDENT",
      setupProgress: "email_verification",
      verificationStatus: "email_pending",
    });

    // Issue an email verification token (6-digit OTP). Persist hashed token and return plaintext in dev.
    await emailVerificationTokenRepository.invalidateAllForUser(user.id);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    await emailVerificationTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    // Create empty student profile and save university if provided
    const { studentProfileRepository } = await import("../repositories/studentProfile.repository");
    await studentProfileRepository.getOrCreateByUserId(user.id);
    if ((input as any).university) {
      await studentProfileRepository.updateByUserId(user.id, { university: (input as any).university });
    }

    // Send email in both dev and production; only return OTP in dev for testing
    try {
      const { emailService } = await import("../services/email.service");
      await emailService.sendVerificationOtp(user.email, otp);
    } catch (err) {
      logger.error("Failed to send verification OTP email:", err);
    }

    if (env.isDevelopment) {
      return { email: user.email, otp };
    }

    return { email: user.email };

  },

  async verifyEmailOtp(email: string, otp: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    const tokenHash = hashToken(otp);
    const stored = await emailVerificationTokenRepository.findByTokenHash(tokenHash);
    const isValid = stored && !stored.usedAt && stored.expiresAt.getTime() > Date.now() && stored.userId === user.id;
    if (!isValid) {
      const latest = await emailVerificationTokenRepository.findLatestForUser(user.id);
      if (latest) {
        const updated = await emailVerificationTokenRepository.incrementAttempts(latest.id);
        if (updated.attempts >= env.OTP_MAX_ATTEMPTS) {
          await emailVerificationTokenRepository.markUsed(latest.id);
          throw ApiError.tooManyRequests("Too many OTP verification attempts. Please request a new code.");
        }
      }
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    await emailVerificationTokenRepository.markUsed(stored.id);

    await userRepository.update(user.id, {
      isEmailVerified: true,
      studentVerified: false,
      verificationStatus: "profile_incomplete",
      setupProgress: "profile_incomplete",
    } as any);

    const freshUser = await userRepository.findById(user.id);
    if (!freshUser) throw ApiError.notFound("User not found after verification.");

    const tokens = await issueTokens(freshUser);
    return { user: toPublicUser(freshUser), ...tokens };
  },


  async resendEmailOtp(email: string): Promise<{ email: string; otp?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Do not reveal
      return { email };
    }

    await emailVerificationTokenRepository.invalidateAllForUser(user.id);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    await emailVerificationTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    // Send email in both dev and production; only return OTP in dev for testing
    try {
      const { emailService } = await import("../services/email.service");
      await emailService.sendVerificationOtp(user.email, otp);
    } catch (err) {
      logger.error("Failed to send verification OTP email:", err);
    }

    if (env.isDevelopment) {
      return { email: user.email, otp };
    }

    return { email: user.email };
  },

  async loginAdmin(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.role !== "ADMIN") {
      throw ApiError.forbidden("Only administrator accounts may log in to the admin dashboard.");
    }

    assertAccountIsUsable(user);
    const tokens = await issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async loginMobile(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    // Role & verification checks for mobile
    if (user.role !== "STUDENT") {
      throw ApiError.forbidden("Only student accounts may log in to the mobile app.");
    }

    if (!user.isEmailVerified || !user.studentVerified) {
      // If studentVerified is false but email verified true, they may be in "profile" or "pending" states.
      throw ApiError.forbidden("Student account not fully verified. Complete email and ID verification before accessing the app.");
    }

    assertAccountIsUsable(user);
    const tokens = await issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async submitIdVerification(userId: string, photoUrl: string): Promise<User> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const updated = await userRepository.update(userId, {
      idPhotoUrl: photoUrl,
      setupProgress: "pending_approval",
      verificationStatus: "pending_approval",
    } as any);

    return updated;
  },

  async forgotPasswordOtp(email: string): Promise<{ otp?: string }> {
    const user = await userRepository.findActiveByEmail(email);

    if (!user) {
      return {};
    }

    await passwordResetTokenRepository.invalidateAllForUser(user.id);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    // Send email in both dev and production; only return OTP in dev for testing
    try {
      const { emailService } = await import("../services/email.service");
      await emailService.sendVerificationOtp(user.email, otp);
    } catch (err) {
      logger.error("Failed to send password reset OTP email:", err);
    }

    if (env.isDevelopment) {
      return { otp };
    }

    return {};
  },

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await userRepository.findActiveByEmail(email);
    if (!user) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    const tokenHash = hashToken(otp);
    const resetToken = await passwordResetTokenRepository.findByTokenHash(tokenHash);

    const isValid = resetToken && !resetToken.usedAt && resetToken.expiresAt.getTime() > Date.now() && resetToken.userId === user.id;
    if (!isValid) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(user.id, { password: hashedPassword });
    await passwordResetTokenRepository.markUsed(resetToken.id);

    await refreshTokenRepository.revokeAllForUser(user.id);
  },

  /**
   * Get user by email (for validation/lookup)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await userRepository.findByEmail(email);
    return user;
  },

  /**
   * Update user fields (for profile edits, avatar, etc.)
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const user = await userRepository.update(userId, data);
    return user;
  },
};
