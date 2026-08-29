import fs from 'fs';
import path from 'path';
import { initialSeedData } from './seedData.js';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'LEARNER' | 'TRAINER' | 'ADMIN';
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

export interface TargetRoleSkill {
  targetRoleId: string;
  skillId: string;
  requiredLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  importance: number; // 1 to 5
}

export interface UserSkill {
  userId: string;
  skillId: string;
  competencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  score: number; // 0 to 100
  lastAssessedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CourseSkill {
  courseId: string;
  skillId: string;
  targetLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
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

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface LessonProgress {
  id: string;
  userId: string;
  moduleId: string;
  completed: boolean;
  completedAt?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  marks: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  percentage: number;
  passed: boolean;
  attemptedAt: string;
  answers?: number[];
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  score: number;
  issuedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ENROLLMENT' | 'COMPLETION' | 'QUIZ' | 'CERTIFICATE' | 'RECOMMENDATION' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  targetRoles: TargetRole[];
  skills: Skill[];
  targetRoleSkills: TargetRoleSkill[];
  userSkills: UserSkill[];
  courses: Course[];
  courseSkills: CourseSkill[];
  courseModules: CourseModule[];
  learningResources: LearningResource[];
  enrollments: Enrollment[];
  lessonProgress: LessonProgress[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  certificates: Certificate[];
  notifications: Notification[];
}

class Database {
  private filePath: string;
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'database.json');
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        if (parsed.users && parsed.courses && parsed.skills) {
          return {
            users: parsed.users || [],
            targetRoles: parsed.targetRoles || [],
            skills: parsed.skills || [],
            targetRoleSkills: parsed.targetRoleSkills || [],
            userSkills: parsed.userSkills || [],
            courses: parsed.courses || [],
            courseSkills: parsed.courseSkills || [],
            courseModules: parsed.courseModules || [],
            learningResources: parsed.learningResources || [],
            enrollments: parsed.enrollments || [],
            lessonProgress: parsed.lessonProgress || [],
            quizzes: parsed.quizzes || [],
            quizQuestions: parsed.quizQuestions || [],
            quizAttempts: parsed.quizAttempts || [],
            certificates: parsed.certificates || [],
            notifications: parsed.notifications || [],
          };
        }
      }
    } catch (e) {
      console.error('Error loading database, seeding fresh data:', e);
    }

    // Seed default data
    const fresh = initialSeedData();
    this.saveDataDirect(fresh);
    return fresh;
  }

  private saveDataDirect(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDataDirect(this.data);
      this.saveTimeout = null;
    }, 100);
  }

  public saveSync() {
    this.saveDataDirect(this.data);
  }

  // Generic accessors
  public get db(): DatabaseSchema {
    return this.data;
  }

  public resetToSeed() {
    this.data = initialSeedData();
    this.saveSync();
    return this.data;
  }
}

export const database = new Database();
