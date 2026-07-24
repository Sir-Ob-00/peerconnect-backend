import { Router } from "express";
import { onboardingController } from "../../controllers/onboarding.controller";
import { authenticate } from "../../middlewares/authenticate";
import { uploadProfilePhoto } from "../../middlewares/upload.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  updateAcademicProfileSchema,
  studyPreferenceSchema,
  customCourseSchema,
  customSkillSchema,
  courseIdSchema,
  skillIdSchema,
  learningInterestsSchema,
  availabilitySchema,
  updateAvailabilitySchema,
  updateBioSchema,
} from "../../validators/onboarding.validator";

export const onboardingRouter = Router();

onboardingRouter.get("/universities", onboardingController.getUniversities);
onboardingRouter.get("/departments", onboardingController.getDepartments);
onboardingRouter.get("/levels", onboardingController.getLevels);
onboardingRouter.get("/programmes", onboardingController.getProgrammes);

onboardingRouter.use(authenticate);

onboardingRouter.get("/profile", onboardingController.getAcademicProfile);
onboardingRouter.patch("/profile/academic", validateRequest({ body: updateAcademicProfileSchema }), onboardingController.updateAcademicProfile);
onboardingRouter.patch("/profile/photo", uploadProfilePhoto, onboardingController.uploadProfilePhoto);

onboardingRouter.get("/study-preferences", onboardingController.getStudyPreferences);
onboardingRouter.patch("/profile/study-preferences", validateRequest({ body: studyPreferenceSchema }), onboardingController.updateStudyPreferences);

onboardingRouter.get("/courses", onboardingController.searchCourses);
onboardingRouter.post("/courses/custom", validateRequest({ body: customCourseSchema }), onboardingController.createCustomCourse);
onboardingRouter.get("/profile/learning-courses", onboardingController.getLearningCourses);
onboardingRouter.post("/profile/learning-courses", validateRequest({ body: courseIdSchema }), onboardingController.addLearningCourse);
onboardingRouter.delete("/profile/learning-courses/:courseId", onboardingController.removeLearningCourse);

onboardingRouter.get("/skills", onboardingController.searchSkills);
onboardingRouter.post("/skills/custom", validateRequest({ body: customSkillSchema }), onboardingController.createCustomSkill);
onboardingRouter.get("/profile/learning-skills", onboardingController.getLearningSkills);
onboardingRouter.post("/profile/learning-skills", validateRequest({ body: skillIdSchema }), onboardingController.addLearningSkill);
onboardingRouter.delete("/profile/learning-skills/:skillId", onboardingController.removeLearningSkill);

onboardingRouter.get("/profile/help-courses", onboardingController.getHelpCourses);
onboardingRouter.post("/profile/help-courses", validateRequest({ body: courseIdSchema }), onboardingController.addHelpCourse);
onboardingRouter.delete("/profile/help-courses/:courseId", onboardingController.removeHelpCourse);
onboardingRouter.get("/profile/help-skills", onboardingController.getHelpSkills);
onboardingRouter.post("/profile/help-skills", validateRequest({ body: skillIdSchema }), onboardingController.addHelpSkill);
onboardingRouter.delete("/profile/help-skills/:skillId", onboardingController.removeHelpSkill);

onboardingRouter.get("/learning-interests", onboardingController.getLearningInterests);
onboardingRouter.get("/profile/learning-interests", onboardingController.getUserLearningInterests);
onboardingRouter.patch("/profile/learning-interests", validateRequest({ body: learningInterestsSchema }), onboardingController.setLearningInterests);

onboardingRouter.get("/profile/availability", onboardingController.getAvailability);
onboardingRouter.post("/profile/availability", validateRequest({ body: availabilitySchema }), onboardingController.addAvailability);
onboardingRouter.patch("/profile/availability/:availabilityId", validateRequest({ body: updateAvailabilitySchema }), onboardingController.updateAvailability);
onboardingRouter.delete("/profile/availability/:availabilityId", onboardingController.removeAvailability);

onboardingRouter.patch("/profile/bio", validateRequest({ body: updateBioSchema }), onboardingController.updateBio);

onboardingRouter.get("/profile/onboarding-status", onboardingController.getOnboardingStatus);
