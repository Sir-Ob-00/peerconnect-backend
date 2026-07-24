import { ApiError } from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { universityRepository } from "../repositories/university.repository";
import { departmentRepository } from "../repositories/department.repository";
import { programmeRepository } from "../repositories/programme.repository";
import { levelRepository } from "../repositories/level.repository";
import { courseRepository } from "../repositories/course.repository";
import { skillRepository } from "../repositories/skill.repository";
import { learningInterestRepository } from "../repositories/learningInterest.repository";
import { studentCourseRepository } from "../repositories/studentCourse.repository";
import { studentSkillRepository } from "../repositories/studentSkill.repository";
import { studentLearningInterestRepository } from "../repositories/studentLearningInterest.repository";
import { availabilityRepository } from "../repositories/availability.repository";
import type {
  UpdateAcademicProfileInput,
  StudyPreferenceInput,
  CustomCourseInput,
  LearningInterestsInput,
  AvailabilityInput,
  UpdateAvailabilityInput,
  UpdateBioInput,
  OnboardingStatusDTO,
} from "../validators/onboarding.validator";
import { uploadImageBuffer } from "../utils/cloudinaryUpload.util";

export const onboardingService = {
  async getUniversities(): Promise<any> {
    const universities = await universityRepository.findMany({ isActive: true });
    return { universities: universities.map(toUniversityDTO) };
  },

  async getDepartments(universityId?: string, search?: string): Promise<any> {
    if (!universityId) {
      return { departments: [] };
    }
    const departments = await departmentRepository.findByUniversity(universityId, search);
    return { departments: departments.map(toDepartmentDTO) };
  },

  async getLevels(): Promise<any> {
    const levels = await levelRepository.findMany({ isActive: true });
    return { levels: levels.map(toLevelDTO) };
  },

  async getProgrammes(universityId?: string, departmentId?: string): Promise<any> {
    if (!universityId || !departmentId) {
      return { programmes: [] };
    }
    const programmes = await programmeRepository.findByUniversityAndDepartment(universityId, departmentId);
    return { programmes: programmes.map(toProgrammeDTO) };
  },

  async createCustomDepartment(userId: string, name: string, universityId: string): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const university = await universityRepository.findById(universityId);
    if (!university || !university.isActive) {
      throw ApiError.badRequest("Selected university is not valid.");
    }

    const department = await departmentRepository.create({
      name: name.trim(),
      universityId,
      custom: true,
    } as any);

    return toDepartmentDTO(department);
  },

  async getAcademicProfile(userId: string): Promise<any> {
    const profile = await studentProfileRepository.getOrCreateByUserId(userId);
    const universities = await universityRepository.findMany({ isActive: true });

    let departmentOptions: any[] = [];
    let programmeOptions: any[] = [];
    let levelOptions: any[] = [];

    if (profile.universityId) {
      departmentOptions = await departmentRepository.findByUniversity(profile.universityId);
      const dept = departmentOptions.find((d: any) => d.id === profile.departmentId);
      if (dept) {
        programmeOptions = await programmeRepository.findByUniversityAndDepartment(profile.universityId, dept.id);
      }
    }
    levelOptions = await levelRepository.findMany({ isActive: true });

    return {
      profile: {
        universityId: profile.universityId,
        departmentId: profile.departmentId,
        levelId: profile.levelId,
        programmeId: profile.programmeId,
        university: profile.university,
        department: profile.department,
        level: profile.level,
        programme: profile.programme,
      },
      universities: universities.map(toUniversityDTO),
      departments: departmentOptions.map(toDepartmentDTO),
      programmes: programmeOptions.map(toProgrammeDTO),
      levels: levelOptions.map(toLevelDTO),
    };
  },

  async updateAcademicProfile(userId: string, input: UpdateAcademicProfileInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const universityId = input.universityId?.trim() || undefined;
    const departmentId = input.departmentId?.trim() || undefined;
    const levelId = input.levelId?.trim() || undefined;
    const programmeId = input.programmeId?.trim() || undefined;

    if (!universityId) {
      throw ApiError.badRequest("University is required.");
    }

    const university = await universityRepository.findById(universityId);
    if (!university || !university.isActive) {
      throw ApiError.badRequest("Selected university is not valid.");
    }

    let departmentName: string | undefined;
    let universityName = university.name;

    if (departmentId) {
      const department = await departmentRepository.findById(departmentId);
      if (!department) {
        throw ApiError.badRequest("Selected department is not valid.");
      }
      if (department.universityId !== universityId) {
        throw ApiError.badRequest("Department does not belong to the selected university.");
      }
      departmentName = department.name;
    }

    let programmeName: string | undefined;
    if (programmeId) {
      const programme = await programmeRepository.findById(programmeId);
      if (!programme) {
        throw ApiError.badRequest("Selected programme is not valid.");
      }
      if (programme.universityId !== universityId) {
        throw ApiError.badRequest("Programme does not belong to the selected university.");
      }
      programmeName = programme.name;
    }

    let levelName: string | undefined;
    if (levelId) {
      const level = await levelRepository.findById(levelId);
      if (!level || !level.isActive) {
        throw ApiError.badRequest("Selected level is not valid.");
      }
      levelName = level.name;
    }

    const updated = await studentProfileRepository.updateByUserId(userId, {
      universityId,
      university: universityName,
      departmentId,
      department: departmentName,
      levelId,
      level: levelName,
      programmeId,
      programme: programmeName,
    });

    await this.checkAndUpdateSetupProgress(userId, updated);

    return {
      universityId: updated.universityId,
      departmentId: updated.departmentId,
      levelId: updated.levelId,
      programmeId: updated.programmeId,
      university: updated.university,
      department: updated.department,
      level: updated.level,
      programme: updated.programme,
    };
  },

  async getStudyPreferences(userId: string): Promise<any> {
    const profile = await studentProfileRepository.getOrCreateByUserId(userId);
    return {
      wantsToLearnCourses: profile.wantsToLearnCourses,
      wantsToLearnSkills: profile.wantsToLearnSkills,
    };
  },

  async updateStudyPreferences(userId: string, input: StudyPreferenceInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const updated = await studentProfileRepository.updateByUserId(userId, {
      wantsToLearnCourses: input.wantsToLearnCourses,
      wantsToLearnSkills: input.wantsToLearnSkills,
    });

    await this.checkAndUpdateSetupProgress(userId, updated);

    return {
      wantsToLearnCourses: updated.wantsToLearnCourses,
      wantsToLearnSkills: updated.wantsToLearnSkills,
    };
  },

  async searchCourses(filters: {
    search?: string;
    universityId?: string;
    departmentId?: string;
    levelId?: string;
    programmeId?: string;
    page: number;
    limit: number;
  }): Promise<any> {
    const result = await courseRepository.search({
      search: filters.search,
      universityId: filters.universityId,
      departmentId: filters.departmentId,
      levelId: filters.levelId,
      programmeId: filters.programmeId,
      page: filters.page,
      limit: filters.limit,
    });

    return {
      courses: result.items.map(toCourseDTO),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / filters.limit)),
      },
    };
  },

  async createCustomCourse(userId: string, input: CustomCourseInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    let universityId = input.departmentId
      ? (await departmentRepository.findById(input.departmentId))?.universityId
      : null;

    if (!universityId) {
      const profile = await studentProfileRepository.findByUserId(userId);
      universityId = profile?.universityId || null;
    }

    if (!universityId) {
      throw ApiError.badRequest("University context is required to create a custom course.");
    }

    const course = await courseRepository.create({
      name: input.name,
      code: input.code || null,
      universityId,
      departmentId: input.departmentId || null,
      programmeId: input.programmeId || null,
      custom: true,
    } as any);

    const existing = await studentCourseRepository.has(userId, course.id, "LEARNING");
    if (!existing) {
      await studentCourseRepository.add({ userId, courseId: course.id, type: "LEARNING" });
    }

    return toCourseDTO(course);
  },

  async getLearningCourses(userId: string): Promise<any> {
    const items = await studentCourseRepository.findByUserAndType(userId, "LEARNING");
    return {
      courses: items.map((sc: any) => toStudentCourseDTO(sc)),
    };
  },

  async addLearningCourse(userId: string, courseId: string): Promise<any> {
    const course = await courseRepository.findById(courseId);
    if (!course || !course.isActive) {
      throw ApiError.badRequest("Course not found.");
    }
    const record = await studentCourseRepository.add({ userId, courseId, type: "LEARNING" });
    return toStudentCourseDTO(record);
  },

  async removeLearningCourse(userId: string, courseId: string): Promise<void> {
    await studentCourseRepository.remove(userId, courseId, "LEARNING");
  },

  async searchSkills(search?: string, programmeId?: string, page = 1, limit = 20): Promise<any> {
    const result = await skillRepository.search(search, programmeId, page, limit);
    return {
      skills: result.items.map(toSkillDTO),
      pagination: {
        page,
        limit,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / limit)),
      },
    };
  },

  async createCustomSkill(userId: string, name: string, programmeId?: string): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const existing = await skillRepository.search(name, programmeId, 1, 1);
    const skill = existing.items[0] || null;

    if (!skill) {
      const created = await skillRepository.create(name, undefined, programmeId);
      await studentSkillRepository.add({ userId, skillId: created.id, type: "LEARNING" });
      return toSkillDTO(created);
    }

    const has = await studentSkillRepository.has(userId, skill.id, "LEARNING");
    if (!has) {
      await studentSkillRepository.add({ userId, skillId: skill.id, type: "LEARNING" });
    }

    return toSkillDTO(skill);
  },

  async getLearningSkills(userId: string): Promise<any> {
    const items = await studentSkillRepository.findByUserAndType(userId, "LEARNING");
    return {
      skills: items.map((ss: any) => toStudentSkillDTO(ss)),
    };
  },

  async addLearningSkill(userId: string, skillId: string): Promise<any> {
    const skill = await skillRepository.findById(skillId);
    if (!skill || !skill.isActive) {
      throw ApiError.badRequest("Skill not found.");
    }
    const record = await studentSkillRepository.add({ userId, skillId, type: "LEARNING" });
    return toStudentSkillDTO(record);
  },

  async removeLearningSkill(userId: string, skillId: string): Promise<void> {
    await studentSkillRepository.remove(userId, skillId, "LEARNING");
  },

  async getHelpCourses(userId: string): Promise<any> {
    const items = await studentCourseRepository.findByUserAndType(userId, "HELP");
    return {
      courses: items.map((sc: any) => toStudentCourseDTO(sc)),
    };
  },

  async addHelpCourse(userId: string, courseId: string): Promise<any> {
    const course = await courseRepository.findById(courseId);
    if (!course || !course.isActive) {
      throw ApiError.badRequest("Course not found.");
    }
    const record = await studentCourseRepository.add({ userId, courseId, type: "HELP" });
    return toStudentCourseDTO(record);
  },

  async removeHelpCourse(userId: string, courseId: string): Promise<void> {
    await studentCourseRepository.remove(userId, courseId, "HELP");
  },

  async getHelpSkills(userId: string): Promise<any> {
    const items = await studentSkillRepository.findByUserAndType(userId, "HELP");
    return {
      skills: items.map((ss: any) => toStudentSkillDTO(ss)),
    };
  },

  async addHelpSkill(userId: string, skillId: string): Promise<any> {
    const skill = await skillRepository.findById(skillId);
    if (!skill || !skill.isActive) {
      throw ApiError.badRequest("Skill not found.");
    }
    const record = await studentSkillRepository.add({ userId, skillId, type: "HELP" });
    return toStudentSkillDTO(record);
  },

  async removeHelpSkill(userId: string, skillId: string): Promise<void> {
    await studentSkillRepository.remove(userId, skillId, "HELP");
  },

  async getLearningInterests(): Promise<any> {
    const items = await learningInterestRepository.findMany({ isActive: true });
    return {
      interests: items.map(toLearningInterestDTO),
    };
  },

  async getUserLearningInterests(userId: string): Promise<any> {
    const items = await studentLearningInterestRepository.findByUser(userId);
    return {
      interests: items.map((sli: any) => toStudentInterestDTO(sli)),
    };
  },

  async setLearningInterests(userId: string, input: LearningInterestsInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const existing = await studentLearningInterestRepository.findByUser(userId);
    const existingIds = new Set(existing.map((e: any) => e.interestId));
    const newIds = new Set(input.interestIds || []);

    for (const item of existing) {
      if (!newIds.has(item.interestId)) {
        await studentLearningInterestRepository.remove(userId, item.interestId);
      }
    }

    for (const interestId of newIds) {
      if (!existingIds.has(interestId)) {
        await studentLearningInterestRepository.add(userId, interestId);
      }
    }

    const updated = await studentLearningInterestRepository.findByUser(userId);
    return {
      interests: updated.map((sli: any) => toStudentInterestDTO(sli)),
      learningInterests: updated.map((i: any) => i.interest.name),
    };
  },

  async getAvailability(userId: string): Promise<any> {
    const items = await availabilityRepository.findByUser(userId);
    return {
      availability: items.map(toAvailabilityDTO),
    };
  },

  async addAvailability(userId: string, input: AvailabilityInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    if (input.endTime <= input.startTime) {
      throw ApiError.badRequest("End time must be after start time.");
    }

    const slot = await availabilityRepository.create({
      userId,
      dayOfWeek: input.dayOfWeek,
      startTime: String(input.startTime).replace(/\0/g, ""),
      endTime: String(input.endTime).replace(/\0/g, ""),
    });

    return toAvailabilityDTO(slot);
  },

  async updateAvailability(userId: string, availabilityId: string, input: UpdateAvailabilityInput): Promise<any> {
    const slot = await availabilityRepository.findById(availabilityId);
    if (!slot || slot.userId !== userId) {
      throw ApiError.notFound("Availability slot not found.");
    }

    if (input.endTime && input.startTime && input.endTime <= input.startTime) {
      throw ApiError.badRequest("End time must be after start time.");
    }

    const updateData: any = {};
    if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
    if (input.startTime !== undefined) updateData.startTime = String(input.startTime).replace(/\0/g, "");
    if (input.endTime !== undefined) updateData.endTime = String(input.endTime).replace(/\0/g, "");

    const updated = await availabilityRepository.update(availabilityId, updateData);
    return toAvailabilityDTO(updated);
  },

  async removeAvailability(userId: string, availabilityId: string): Promise<void> {
    const slot = await availabilityRepository.findById(availabilityId);
    if (!slot || slot.userId !== userId) {
      throw ApiError.notFound("Availability slot not found.");
    }
    await availabilityRepository.remove(availabilityId);
  },

  async updateBio(userId: string, input: UpdateBioInput): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    const updated = await studentProfileRepository.updateByUserId(userId, {
      bio: input.bio,
    });

    await this.checkAndUpdateSetupProgress(userId, updated);

    return { bio: updated.bio };
  },

  async uploadProfilePhoto(userId: string, file: Express.Multer.File | undefined): Promise<any> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }
    if (!file) {
      throw ApiError.badRequest('No image file provided. Attach one under the "photo" field.');
    }

    const uploaded = await uploadImageBuffer(file.buffer, `user_${userId}`);
    const updated = await studentProfileRepository.setProfilePhoto(userId, uploaded.secureUrl);

    return {
      profilePhoto: updated.profilePhoto,
    };
  },

  async getOnboardingStatus(userId: string): Promise<OnboardingStatusDTO> {
    const profile = await studentProfileRepository.getOrCreateByUserId(userId);
    const learningCourses = await studentCourseRepository.findByUserAndType(userId, "LEARNING");
    const learningSkills = await studentSkillRepository.findByUserAndType(userId, "LEARNING");
    const interests = await studentLearningInterestRepository.findByUser(userId);
    const slots = await availabilityRepository.findByUser(userId);

    const academicComplete = !!(profile.universityId && profile.departmentId && profile.levelId);
    const studyPrefComplete = profile.wantsToLearnCourses || profile.wantsToLearnSkills;
    const learningItemsComplete =
      (!profile.wantsToLearnCourses || learningCourses.length > 0) &&
      (!profile.wantsToLearnSkills || learningSkills.length > 0);
    const interestsComplete = interests.length > 0;
    const availabilityComplete = slots.length > 0;
    const bioComplete = true;

    const steps: { key: string; label: string; complete: boolean }[] = [
      { key: "academic_profile", label: "Academic Profile", complete: academicComplete },
      { key: "study_preferences", label: "Study Preferences", complete: studyPrefComplete },
      { key: "learning_items", label: "Learning Items", complete: learningItemsComplete },
      { key: "learning_interests", label: "Learning Interests", complete: interestsComplete },
      { key: "availability", label: "Availability", complete: availabilityComplete },
      { key: "bio", label: "Short Bio", complete: bioComplete },
    ];

    const completedSteps = steps.filter((s) => s.complete).map((s) => s.key);
    const requiredIncomplete = steps
      .filter((s) => !s.complete && s.key !== "bio")
      .map((s) => s.label);

    const canProceed =
      academicComplete &&
      studyPrefComplete &&
      learningItemsComplete &&
      interestsComplete &&
      availabilityComplete;

    const firstIncomplete = steps.find((s) => !s.complete && s.key !== "bio");
    const currentStep = firstIncomplete ? firstIncomplete.key : "id_verification";

    return {
      currentStep,
      completedSteps,
      requiredIncomplete,
      canProceedToIdVerification: canProceed,
    };
  },

  async checkAndUpdateSetupProgress(userId: string, profile: any): Promise<void> {
    const status = await this.getOnboardingStatus(userId);
    if (status.canProceedToIdVerification && profile.setupProgress !== "id_verification_pending") {
      await userRepository.update(userId, {
        setupProgress: "id_verification_pending",
        verificationStatus: "id_verification_pending",
      } as any);
    }
  },
};

function toUniversityDTO(u: any) {
  return { id: u.id, name: u.name, code: u.code, isActive: u.isActive };
}

function toDepartmentDTO(d: any) {
  return { id: d.id, name: d.name, code: d.code, universityId: d.universityId, custom: d.custom };
}

function toProgrammeDTO(p: any) {
  return { id: p.id, name: p.name, universityId: p.universityId, departmentId: p.departmentId, custom: p.custom };
}

function toLevelDTO(l: any) {
  return { id: l.id, name: l.name, code: l.code, isActive: l.isActive, sortOrder: l.sortOrder };
}

function toCourseDTO(c: any) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    universityId: c.universityId,
    departmentId: c.departmentId,
    levelId: c.levelId,
    custom: c.custom,
    isActive: c.isActive,
  };
}

function toSkillDTO(s: any) {
  return { id: s.id, name: s.name, category: s.category, isActive: s.isActive };
}

function toLearningInterestDTO(li: any) {
  return { id: li.id, name: li.name, description: li.description, isActive: li.isActive, sortOrder: li.sortOrder };
}

function toStudentCourseDTO(sc: any) {
  return {
    id: sc.id,
    courseId: sc.courseId,
    course: toCourseDTO(sc.course),
    type: sc.type,
  };
}

function toStudentSkillDTO(ss: any) {
  return {
    id: ss.id,
    skillId: ss.skillId,
    skill: toSkillDTO(ss.skill),
    type: ss.type,
  };
}

function toStudentInterestDTO(sli: any) {
  return {
    id: sli.id,
    interestId: sli.interestId,
    interest: toLearningInterestDTO(sli.interest),
  };
}

function toAvailabilityDTO(a: any) {
  return {
    id: a.id,
    dayOfWeek: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
    isActive: a.isActive,
  };
}
