export type Role = 'LEARNER' | 'TRAINER' | 'ADMIN';

export type CompetencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  organization: string;
  profileImage?: string;
  targetRoleId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TargetRole {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface UserSkillProfileItem {
  skillId: string;
  name: string;
  description: string;
  category: string;
  score: number;
  competencyLevel: CompetencyLevel;
  lastAssessedAt?: string;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  currentScore: number;
  currentLevel: CompetencyLevel;
  requiredLevel: CompetencyLevel;
  requiredScore: number;
  gapScore: number;
  importance: number;
  priorityScore: number;
  gapType: 'CRITICAL' | 'MEDIUM' | 'MINOR' | 'MATCHED';
  reason: string;
}

export interface SkillGapAnalysis {
  targetRole: {
    id: string;
    name: string;
    description: string;
    category: string;
  } | null;
  overallReadinessPercentage: number;
  totalRequiredSkills: number;
  matchedCount: number;
  criticalGapsCount: number;
  mediumGapsCount: number;
  matchedSkills: SkillGapItem[];
  criticalGaps: SkillGapItem[];
  mediumGaps: SkillGapItem[];
  minorGaps: SkillGapItem[];
  allSkillGaps: SkillGapItem[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  trainerId: string;
  trainerName?: string;
  skills?: Array<{ id: string; name: string; targetLevel: string; description?: string }>;
  moduleCount?: number;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResource {
  id: string;
  moduleId: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'ARTICLE' | 'LINK' | 'TEXT';
  url?: string;
  content?: string;
  duration?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  resources?: LearningResource[];
}

export interface CourseDetail extends Course {
  trainer: {
    id?: string;
    name: string;
    department?: string;
    organization?: string;
    profileImage?: string;
  };
  modules: CourseModule[];
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    questionCount: number;
  } | null;
  userProgress?: {
    isEnrolled: boolean;
    enrollmentStatus?: 'IN_PROGRESS' | 'COMPLETED';
    enrolledAt?: string;
    completedModuleIds: string[];
    progressPercentage: number;
    quizAttempt?: any;
    certificate?: any;
  } | null;
}

export interface CourseRecommendation {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  relevanceScore: number;
  targetSkills: string[];
  primaryGapSkill: string;
  reason: string;
  isEnrolled: boolean;
  enrollmentStatus?: 'IN_PROGRESS' | 'COMPLETED';
  progressPercentage: number;
}

export interface LearningPathStep {
  stepNumber: number;
  courseId: string;
  title: string;
  description: string;
  targetSkill: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NEXT_UP' | 'LOCKED';
  reason: string;
  scoreGained?: number;
}

export interface LearningPathData {
  targetRole: string;
  readiness: number;
  steps: LearningPathStep[];
}

export interface EnrollmentItem {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnail: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  enrolledAt: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  completedModulesCount: number;
  totalModulesCount: number;
  progressPercentage: number;
  certificateId?: string;
  certificateNumber?: string;
}

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  score: number;
  issuedAt: string;
  courseId: string;
  courseTitle: string;
  category: string;
  recipientName: string;
  organization: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ENROLLMENT' | 'COMPLETION' | 'QUIZ' | 'CERTIFICATE' | 'RECOMMENDATION' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  marks: number;
}

export interface QuizData {
  id: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  passingScore: number;
  totalQuestions: number;
  questions: QuizQuestionItem[];
  lastAttempt?: {
    score: number;
    percentage: number;
    passed: boolean;
    attemptedAt: string;
  } | null;
}
