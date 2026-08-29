import { database, UserSkill } from '../db/database.js';

export const LEVEL_BENCHMARKS: Record<string, number> = {
  BEGINNER: 40,
  INTERMEDIATE: 65,
  ADVANCED: 85,
  EXPERT: 95
};

export function scoreToCompetency(score: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
  if (score >= 90) return 'EXPERT';
  if (score >= 70) return 'ADVANCED';
  if (score >= 40) return 'INTERMEDIATE';
  return 'BEGINNER';
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  currentScore: number;
  currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  requiredLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  requiredScore: number;
  gapScore: number; // requiredScore - currentScore
  importance: number; // 1-5
  priorityScore: number; // weighted gap
  gapType: 'CRITICAL' | 'MEDIUM' | 'MINOR' | 'MATCHED';
  reason: string;
}

export interface SkillGapAnalysisResult {
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

export interface CourseRecommendation {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  relevanceScore: number; // 0-100
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

export class SkillEngine {
  /**
   * Get complete current skill profile for a user
   */
  public static getUserSkillProfile(userId: string) {
    const db = database.db;
    const userSkills = db.userSkills.filter(us => us.userId === userId);
    
    return db.skills.map(skill => {
      const userSkill = userSkills.find(us => us.skillId === skill.id);
      const score = userSkill ? userSkill.score : 0;
      const competencyLevel = userSkill ? userSkill.competencyLevel : 'BEGINNER';
      const lastAssessedAt = userSkill?.lastAssessedAt;

      return {
        skillId: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        score,
        competencyLevel,
        lastAssessedAt
      };
    });
  }

  /**
   * Perform deep skill-gap analysis comparing current skills vs target role
   */
  public static getSkillGapAnalysis(userId: string): SkillGapAnalysisResult {
    const db = database.db;
    const user = db.users.find(u => u.id === userId);
    if (!user || !user.targetRoleId) {
      return {
        targetRole: null,
        overallReadinessPercentage: 0,
        totalRequiredSkills: 0,
        matchedCount: 0,
        criticalGapsCount: 0,
        mediumGapsCount: 0,
        matchedSkills: [],
        criticalGaps: [],
        mediumGaps: [],
        minorGaps: [],
        allSkillGaps: []
      };
    }

    const targetRole = db.targetRoles.find(r => r.id === user.targetRoleId);
    if (!targetRole) {
      return {
        targetRole: null,
        overallReadinessPercentage: 0,
        totalRequiredSkills: 0,
        matchedCount: 0,
        criticalGapsCount: 0,
        mediumGapsCount: 0,
        matchedSkills: [],
        criticalGaps: [],
        mediumGaps: [],
        minorGaps: [],
        allSkillGaps: []
      };
    }

    const requiredSkills = db.targetRoleSkills.filter(trs => trs.targetRoleId === targetRole.id);
    const userSkills = db.userSkills.filter(us => us.userId === userId);

    const gapItems: SkillGapItem[] = [];
    let weightedReadinessSum = 0;
    let totalWeight = 0;

    for (const req of requiredSkills) {
      const skill = db.skills.find(s => s.id === req.skillId);
      if (!skill) continue;

      const userSkill = userSkills.find(us => us.skillId === req.skillId);
      const currentScore = userSkill ? userSkill.score : 0;
      const currentLevel = userSkill ? userSkill.competencyLevel : scoreToCompetency(currentScore);
      const requiredScore = LEVEL_BENCHMARKS[req.requiredLevel] || 65;
      const rawGap = Math.max(0, requiredScore - currentScore);

      const importanceWeight = req.importance || 3;
      const priorityScore = Math.round(rawGap * (importanceWeight / 5) * 10) / 10;

      // Readiness calculation component
      const scoreAchieved = Math.min(currentScore, requiredScore);
      weightedReadinessSum += (scoreAchieved / requiredScore) * importanceWeight;
      totalWeight += importanceWeight;

      let gapType: 'CRITICAL' | 'MEDIUM' | 'MINOR' | 'MATCHED' = 'MATCHED';
      let reason = `Competency standard satisfied for ${targetRole.name}.`;

      if (rawGap > 0) {
        if (rawGap >= 40 || (rawGap >= 25 && importanceWeight >= 4)) {
          gapType = 'CRITICAL';
          reason = `Critical deficiency in high-importance skill (${importanceWeight}/5 importance). Immediate focus required.`;
        } else if (rawGap >= 15) {
          gapType = 'MEDIUM';
          reason = `Moderate capability gap. Needs targeted course completion to meet role expectations.`;
        } else {
          gapType = 'MINOR';
          reason = `Minor refinement needed to achieve benchmark ${req.requiredLevel} level.`;
        }
      }

      gapItems.push({
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        currentScore,
        currentLevel,
        requiredLevel: req.requiredLevel,
        requiredScore,
        gapScore: rawGap,
        importance: importanceWeight,
        priorityScore,
        gapType,
        reason
      });
    }

    // Sort gap items by priority descending
    gapItems.sort((a, b) => b.priorityScore - a.priorityScore);

    const matchedSkills = gapItems.filter(g => g.gapType === 'MATCHED');
    const criticalGaps = gapItems.filter(g => g.gapType === 'CRITICAL');
    const mediumGaps = gapItems.filter(g => g.gapType === 'MEDIUM');
    const minorGaps = gapItems.filter(g => g.gapType === 'MINOR');

    const overallReadinessPercentage = totalWeight > 0 
      ? Math.min(100, Math.round((weightedReadinessSum / totalWeight) * 100))
      : 0;

    return {
      targetRole: {
        id: targetRole.id,
        name: targetRole.name,
        description: targetRole.description,
        category: targetRole.category
      },
      overallReadinessPercentage,
      totalRequiredSkills: requiredSkills.length,
      matchedCount: matchedSkills.length,
      criticalGapsCount: criticalGaps.length,
      mediumGapsCount: mediumGaps.length,
      matchedSkills,
      criticalGaps,
      mediumGaps,
      minorGaps,
      allSkillGaps: gapItems
    };
  }

  /**
   * Generate personalized course recommendations based on highest priority skill gaps
   */
  public static getRecommendations(userId: string): CourseRecommendation[] {
    const db = database.db;
    const gapAnalysis = this.getSkillGapAnalysis(userId);
    const userEnrollments = db.enrollments.filter(e => e.userId === userId);
    const lessonProgress = db.lessonProgress.filter(lp => lp.userId === userId);

    const activeGaps = gapAnalysis.allSkillGaps.filter(g => g.gapScore > 0);
    const publishedCourses = db.courses.filter(c => c.status === 'PUBLISHED');

    const recommendations: CourseRecommendation[] = [];

    for (const course of publishedCourses) {
      const courseSkills = db.courseSkills.filter(cs => cs.courseId === course.id);
      const enrollment = userEnrollments.find(e => e.courseId === course.id);
      const isCompleted = enrollment?.status === 'COMPLETED';

      // Skip fully completed courses from primary recommendations
      if (isCompleted) continue;

      // Check skill alignment with learner's detected gaps
      let maxGapWeight = 0;
      let matchedGapSkill: SkillGapItem | null = null;
      const skillsTaughtNames: string[] = [];

      for (const cs of courseSkills) {
        const skill = db.skills.find(s => s.id === cs.skillId);
        if (skill) {
          skillsTaughtNames.push(skill.name);
        }

        const gap = activeGaps.find(g => g.skillId === cs.skillId);
        if (gap && gap.priorityScore > maxGapWeight) {
          maxGapWeight = gap.priorityScore;
          matchedGapSkill = gap;
        }
      }

      // Calculate progress if enrolled
      let progressPercentage = 0;
      if (enrollment) {
        const modules = db.courseModules.filter(m => m.courseId === course.id);
        if (modules.length > 0) {
          const completedCount = modules.filter(m => 
            lessonProgress.some(lp => lp.moduleId === m.id && lp.completed)
          ).length;
          progressPercentage = Math.round((completedCount / modules.length) * 100);
        }
      }

      if (matchedGapSkill) {
        // High relevance score
        const baseScore = Math.min(98, 60 + Math.round(matchedGapSkill.priorityScore * 1.2));
        const relevanceScore = enrollment ? Math.min(99, baseScore + 5) : baseScore;

        recommendations.push({
          courseId: course.id,
          courseTitle: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          difficulty: course.difficulty,
          duration: course.duration,
          relevanceScore,
          targetSkills: skillsTaughtNames,
          primaryGapSkill: matchedGapSkill.skillName,
          reason: `Recommended because ${matchedGapSkill.skillName} is your #${activeGaps.indexOf(matchedGapSkill) + 1} priority skill gap (${matchedGapSkill.gapType} priority for ${gapAnalysis.targetRole?.name || 'your target role'}).`,
          isEnrolled: !!enrollment,
          enrollmentStatus: enrollment?.status,
          progressPercentage
        });
      } else if (courseSkills.length > 0) {
        // General elective / related course recommendation
        recommendations.push({
          courseId: course.id,
          courseTitle: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          difficulty: course.difficulty,
          duration: course.duration,
          relevanceScore: 50,
          targetSkills: skillsTaughtNames,
          primaryGapSkill: skillsTaughtNames[0] || 'Technical Skills',
          reason: `Enhances complementary skills across ${course.category}.`,
          isEnrolled: !!enrollment,
          enrollmentStatus: enrollment?.status,
          progressPercentage
        });
      }
    }

    // Sort by relevance score descending
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return recommendations;
  }

  /**
   * Generate personalized ordered learning path to reach 100% readiness
   */
  public static getLearningPath(userId: string): {
    targetRole: string;
    readiness: number;
    steps: LearningPathStep[];
  } {
    const db = database.db;
    const gapAnalysis = this.getSkillGapAnalysis(userId);
    const userEnrollments = db.enrollments.filter(e => e.userId === userId);
    const certificates = db.certificates.filter(c => c.userId === userId);

    const steps: LearningPathStep[] = [];
    let stepCount = 1;

    // First list completed foundational courses that build target role skills
    for (const enrollment of userEnrollments) {
      if (enrollment.status === 'COMPLETED') {
        const course = db.courses.find(c => c.id === enrollment.courseId);
        const cert = certificates.find(c => c.courseId === enrollment.courseId);
        if (course) {
          const courseSkills = db.courseSkills.filter(cs => cs.courseId === course.id);
          const firstSkill = db.skills.find(s => s.id === courseSkills[0]?.skillId);

          steps.push({
            stepNumber: stepCount++,
            courseId: course.id,
            title: course.title,
            description: course.description,
            targetSkill: firstSkill ? firstSkill.name : course.category,
            difficulty: course.difficulty,
            duration: course.duration,
            status: 'COMPLETED',
            reason: 'Mastery verified through passed assessment and certificate.',
            scoreGained: cert ? cert.score : 85
          });
        }
      }
    }

    // Next add active in-progress courses
    for (const enrollment of userEnrollments) {
      if (enrollment.status === 'IN_PROGRESS') {
        const course = db.courses.find(c => c.id === enrollment.courseId);
        if (course) {
          const courseSkills = db.courseSkills.filter(cs => cs.courseId === course.id);
          const firstSkill = db.skills.find(s => s.id === courseSkills[0]?.skillId);

          steps.push({
            stepNumber: stepCount++,
            courseId: course.id,
            title: course.title,
            description: course.description,
            targetSkill: firstSkill ? firstSkill.name : course.category,
            difficulty: course.difficulty,
            duration: course.duration,
            status: 'IN_PROGRESS',
            reason: 'Currently active learning module in progress.',
          });
        }
      }
    }

    // Next add highest priority recommended courses for remaining gaps
    const recommendations = this.getRecommendations(userId);
    let assignedNextUp = false;

    for (const rec of recommendations) {
      if (steps.some(s => s.courseId === rec.courseId)) continue;
      const course = db.courses.find(c => c.id === rec.courseId);
      if (!course) continue;

      const isNext = !assignedNextUp && !steps.some(s => s.status === 'IN_PROGRESS');
      if (isNext) assignedNextUp = true;

      steps.push({
        stepNumber: stepCount++,
        courseId: course.id,
        title: course.title,
        description: course.description,
        targetSkill: rec.primaryGapSkill,
        difficulty: course.difficulty,
        duration: course.duration,
        status: isNext ? 'NEXT_UP' : 'LOCKED',
        reason: rec.reason
      });

      if (steps.length >= 6) break;
    }

    return {
      targetRole: gapAnalysis.targetRole ? gapAnalysis.targetRole.name : 'Target Role',
      readiness: gapAnalysis.overallReadinessPercentage,
      steps
    };
  }

  /**
   * Update user competencies based on quiz assessment results
   */
  public static updateCompetencyFromQuiz(userId: string, quizId: string, percentage: number) {
    const db = database.db;
    const quiz = db.quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const course = db.courses.find(c => c.id === quiz.courseId);
    if (!course) return;

    const courseSkills = db.courseSkills.filter(cs => cs.courseId === course.id);
    const now = new Date().toISOString();

    for (const cs of courseSkills) {
      let userSkill = db.userSkills.find(us => us.userId === userId && us.skillId === cs.skillId);
      
      // Calculate weighted progress: score combines existing and new assessment
      let newScore = percentage;
      if (userSkill) {
        // If user retook and improved, take highest or weighted improvement
        newScore = Math.max(userSkill.score, Math.round((userSkill.score * 0.3) + (percentage * 0.7)));
        userSkill.score = newScore;
        userSkill.competencyLevel = scoreToCompetency(newScore);
        userSkill.lastAssessedAt = now;
      } else {
        userSkill = {
          userId,
          skillId: cs.skillId,
          score: newScore,
          competencyLevel: scoreToCompetency(newScore),
          lastAssessedAt: now
        };
        db.userSkills.push(userSkill);
      }
    }

    // Check if course should be marked complete and certificate awarded
    if (percentage >= quiz.passingScore) {
      let enrollment = db.enrollments.find(e => e.userId === userId && e.courseId === course.id);
      if (enrollment) {
        enrollment.status = 'COMPLETED';
        enrollment.completedAt = now;
      } else {
        db.enrollments.push({
          id: `enr-${Date.now()}`,
          userId,
          courseId: course.id,
          enrolledAt: now,
          completedAt: now,
          status: 'COMPLETED'
        });
      }

      // Mark all course modules as completed
      const modules = db.courseModules.filter(m => m.courseId === course.id);
      for (const mod of modules) {
        let prog = db.lessonProgress.find(lp => lp.userId === userId && lp.moduleId === mod.id);
        if (!prog) {
          db.lessonProgress.push({
            id: `prog-${Date.now()}-${mod.id}`,
            userId,
            moduleId: mod.id,
            completed: true,
            completedAt: now
          });
        } else {
          prog.completed = true;
          prog.completedAt = now;
        }
      }

      // Issue Certificate if not already issued
      const existingCert = db.certificates.find(c => c.userId === userId && c.courseId === course.id);
      if (!existingCert) {
        const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certNumber = `CC-2026-${randomHex}`;
        const newCert = {
          id: `cert-${Date.now()}`,
          userId,
          courseId: course.id,
          certificateNumber: certNumber,
          score: percentage,
          issuedAt: now
        };
        db.certificates.push(newCert);

        // Add certificate notification
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId,
          title: `Certificate Earned: ${course.title}`,
          message: `Congratulations! You passed with ${percentage}% score. Certificate #${certNumber} has been issued.`,
          type: 'CERTIFICATE',
          isRead: false,
          createdAt: now
        });
      }
    }

    database.save();
  }
}
