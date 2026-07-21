/**
 * Frontend Auth Controller — Implements all 11 endpoints from the API spec
 * Base path: /auth/*
 * All responses use the exact format expected by the React Native mobile app
 */

import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { studentProfileService } from "../services/studentProfile.service";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { onlineUsersRegistry } from "../sockets/onlineUsers.registry";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { validateUniversityEmailOrThrow } from "../utils/email.util";

function buildFrontendUser(user: any, profile: any = {}) {
  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    university: profile.university || "",
    department: profile.department || "",
    level: profile.level || "",
    accountType: user.role === "ADMIN" ? "admin" : "student",
    avatarUrl: user.profileImage || "",
    bio: profile.bio || "",
    skills: (profile.skills || []).map((skill: string, idx: number) => ({
      id: `sk_${idx}`,
      name: skill,
      category: "General",
      proficiency: "beginner",
    })),
    learningInterests: profile.learningInterests || [],
    availability: profile.availability || "",
    setupProgress: user.setupProgress || "email_verification",
    idPhotoUrl: user.idPhotoUrl || null,
    rating: 0,
    sessionsCompleted: 0,
    studentsHelped: 0,
    isAvailable: profile.isAvailable ?? true,
    isOnline: onlineUsersRegistry.isOnline(user.id),
    isVerified: user.studentVerified ?? false,
    emailVerified: user.isEmailVerified ?? false,
    studentVerified: user.studentVerified ?? false,
    verificationStatus: user.verificationStatus || "email_pending",
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };
}

async function getUserWithProfile(userId: string) {
  const user = await authService.getMe(userId);
  const profile = await studentProfileRepository.findByUserId(userId);
  return buildFrontendUser(user, profile);
}

export const frontendAuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      throw ApiError.badRequest("Full name must be at least 2 characters");
    }

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Valid email is required");
    }

    const emailLower = email.toLowerCase();
    try {
      validateUniversityEmailOrThrow(emailLower);
    } catch (err) {
      throw ApiError.badRequest("Use your university email address");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw ApiError.unprocessable("Password must be at least 8 characters");
    }

    const existingUser = await authService.getUserByEmail(emailLower);
    if (existingUser) {
      throw ApiError.badRequest("Email is already registered");
    }

    const [firstName, ...lastNameParts] = fullName.trim().split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    await authService.registerMobile({
      firstName: firstName || "Student",
      lastName: lastName || "",
      fullName: fullName.trim(),
      email: emailLower,
      password,
      confirmPassword: password,
    });

    res.status(201).json({ message: "Verification code sent to email" });
  }),

  sendOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Valid email is required");
    }

    const emailLower = email.toLowerCase();
    const user = await authService.getUserByEmail(emailLower);

    if (!user) {
      throw ApiError.notFound("No account found with this email");
    }

    await authService.resendEmailOtp(emailLower);

    res.status(200).json({ message: "Verification code sent" });
  }),

  verifyOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Valid email is required");
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      throw ApiError.badRequest("OTP must be exactly 6 digits");
    }

    const emailLower = email.toLowerCase();
    const result = await authService.verifyEmailOtp(emailLower, otp);

    if (!result.user || !result.accessToken) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    const userObj = await authService.getMe(result.user.id);
    const profile = await studentProfileRepository.findByUserId(result.user.id);
    const formatted = buildFrontendUser(userObj, profile);

    res.status(200).json({
      user: formatted,
      token: result.accessToken,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required");
    }

    const result = await authService.loginMobile({
      email: email.toLowerCase(),
      password,
    });

    if (!result.user || !result.accessToken) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const userObj = await authService.getMe(result.user.id);
    const profile = await studentProfileRepository.findByUserId(result.user.id);
    const formatted = buildFrontendUser(userObj, profile);

    res.status(200).json({
      user: formatted,
      token: result.accessToken,
    });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    const user = await getUserWithProfile(req.user.id);

    res.status(200).json({ user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    await authService.logout(req.body?.refreshToken as string | undefined);

    res.status(200).json({ message: "Logged out successfully" });
  }),

  saveProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    const {
      university,
      department,
      level,
      skills,
      learningInterests,
      availability,
      bio,
      avatarUrl,
    } = req.body;

    if (!department || typeof department !== "string") {
      throw ApiError.badRequest("Department is required");
    }

    if (!level || typeof level !== "string") {
      throw ApiError.badRequest("Level is required");
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      throw ApiError.badRequest("At least one skill is required");
    }

    if (!availability || typeof availability !== "string") {
      throw ApiError.badRequest("Availability is required");
    }

    const updatedProfile = await studentProfileService.updateMyProfile(req.user.id, {
      university: university || "",
      department,
      level,
      skills,
      learningInterests: learningInterests || [],
      availability,
      bio: bio || "",
    });

    if (avatarUrl) {
      await authService.updateUser(req.user.id, { profileImage: avatarUrl });
    }

    const user = await authService.getMe(req.user.id);
    const formatted = buildFrontendUser(user, updatedProfile);

    res.status(200).json({ user: formatted });
  }),

  verifyId: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    const { idPhotoUrl } = req.body;

    if (!idPhotoUrl || typeof idPhotoUrl !== "string") {
      throw ApiError.badRequest("Valid image URL is required");
    }

    const updatedUser = await authService.submitIdVerification(req.user.id, idPhotoUrl);
    const profile = await studentProfileRepository.findByUserId(req.user.id);
    const formatted = buildFrontendUser(updatedUser, profile);

    res.status(200).json({ user: formatted });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Valid email is required");
    }

    const emailLower = email.toLowerCase();
    const user = await authService.getUserByEmail(emailLower);

    if (!user) {
      throw ApiError.notFound("No account found with this email");
    }

    await authService.forgotPasswordOtp(emailLower);

    res.status(200).json({ message: "Reset code sent to email" });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      throw ApiError.badRequest("Email, OTP, and password are required");
    }

    if (!/^\d{6}$/.test(otp)) {
      throw ApiError.badRequest("OTP must be exactly 6 digits");
    }

    if (password.length < 8) {
      throw ApiError.badRequest("Password must be at least 8 characters");
    }

    await authService.resetPasswordWithOtp(email.toLowerCase(), otp, password);

    res.status(200).json({ message: "Password reset successfully" });
  }),

  updateUser: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    const { fullName, bio, avatarUrl, department, level, skills, learningInterests, availability } =
      req.body;

    const updateData: any = {};
    if (fullName) {
      const [firstName, ...lastNameParts] = fullName.trim().split(" ");
      updateData.firstName = firstName || "Student";
      updateData.lastName = lastNameParts.join(" ") || "";
    }
    if (avatarUrl) {
      updateData.profileImage = avatarUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await authService.updateUser(req.user.id, updateData);
    }

    if (department || level || skills || learningInterests !== undefined || availability !== undefined || bio !== undefined) {
      const profileUpdate: any = {};
      if (department) profileUpdate.department = department;
      if (level) profileUpdate.level = level;
      if (skills) profileUpdate.skills = skills;
      if (learningInterests) profileUpdate.learningInterests = learningInterests;
      if (availability) profileUpdate.availability = availability;
      if (bio !== undefined) profileUpdate.bio = bio;

      await studentProfileService.updateMyProfile(req.user.id, profileUpdate);
    }

    const user = await getUserWithProfile(req.user.id);

    res.status(200).json({ user });
  }),
};
