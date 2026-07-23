import type { Course, Skill, LearningInterest, University, Department, Programme, Level } from "@prisma/client";

export interface UniversityDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  code: string | null;
  universityId: string;
  custom: boolean;
}

export interface ProgrammeDTO {
  id: string;
  name: string;
  universityId: string;
  departmentId: string;
  custom: boolean;
}

export interface LevelDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CourseDTO {
  id: string;
  name: string;
  code: string | null;
  universityId: string;
  departmentId: string | null;
  levelId: string | null;
  custom: boolean;
  isActive: boolean;
}

export interface SkillDTO {
  id: string;
  name: string;
  category: string | null;
  isActive: boolean;
}

export interface LearningInterestDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface StudentCourseDTO {
  id: string;
  courseId: string;
  course: CourseDTO;
  type: "LEARNING" | "HELP";
}

export interface StudentSkillDTO {
  id: string;
  skillId: string;
  skill: SkillDTO;
  type: "LEARNING" | "HELP";
}

export interface StudentInterestDTO {
  id: string;
  interestId: string;
  interest: LearningInterestDTO;
}

export interface AvailabilityDTO {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface OnboardingStatusDTO {
  currentStep: string;
  completedSteps: string[];
  requiredIncomplete: string[];
  canProceedToIdVerification: boolean;
}

export function toUniversityDTO(u: University): UniversityDTO {
  return {
    id: u.id,
    name: u.name,
    code: u.code,
    isActive: u.isActive,
  };
}

export function toDepartmentDTO(d: Department): DepartmentDTO {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    universityId: d.universityId,
    custom: d.custom,
  };
}

export function toProgrammeDTO(p: Programme): ProgrammeDTO {
  return {
    id: p.id,
    name: p.name,
    universityId: p.universityId,
    departmentId: p.departmentId,
    custom: p.custom,
  };
}

export function toLevelDTO(l: Level): LevelDTO {
  return {
    id: l.id,
    name: l.name,
    code: l.code,
    isActive: l.isActive,
    sortOrder: l.sortOrder,
  };
}

export function toCourseDTO(c: Course): CourseDTO {
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

export function toSkillDTO(s: Skill): SkillDTO {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    isActive: s.isActive,
  };
}

export function toLearningInterestDTO(li: LearningInterest): LearningInterestDTO {
  return {
    id: li.id,
    name: li.name,
    description: li.description,
    isActive: li.isActive,
    sortOrder: li.sortOrder,
  };
}
