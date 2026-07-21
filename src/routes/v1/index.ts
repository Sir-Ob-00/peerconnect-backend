import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { userRouter } from "./user.routes";
import { profileRouter } from "./profile.routes";
import { studentRouter } from "./student.routes";
import { sessionRouter } from "./session.routes";
import { chatRouter } from "./chat.routes";
import { reviewRouter } from "./review.routes";
import { notificationRouter } from "./notification.routes";
import { mobileAuthRouter } from "./mobileAuth.routes";
import { adminAuthRouter } from "./adminAuth.routes";
import { adminVerificationsRouter } from "./adminVerifications.routes";

export const v1Router = Router();

v1Router.use(healthRouter);
// Mount mobile-specific routes under /mobile
v1Router.use("/mobile", mobileAuthRouter);
// Admin namespace
v1Router.use("/admin", adminAuthRouter);
v1Router.use("/admin", adminVerificationsRouter);
// Keep existing authRouter for backward compatibility (legacy clients)
v1Router.use(authRouter);
v1Router.use(userRouter);
v1Router.use(profileRouter);
v1Router.use(studentRouter);
v1Router.use(sessionRouter);
v1Router.use(chatRouter);
v1Router.use(reviewRouter);
v1Router.use(notificationRouter);

// Future phases mount here.
