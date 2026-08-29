import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { database } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { SkillEngine } from '../services/skillEngine.js';

export const courseRouter = Router();

// GET /api/courses - List courses with filters
courseRouter.get('/', (req: Request, res: Response) => {
  const { search, category, difficulty, skillId, status } = req.query;
  const db = database.db;

  let filtered = db.courses.filter(c => c.status === (status || 'PUBLISHED'));

  if (category && category !== 'ALL') {
    filtered = filtered.filter(c => c.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (difficulty && difficulty !== 'ALL') {
    filtered = filtered.filter(c => c.difficulty.toLowerCase() === (difficulty as string).toLowerCase());
  }

  if (skillId && skillId !== 'ALL') {
    const courseIdsWithSkill = db.courseSkills
      .filter(cs => cs.skillId === skillId)
      .map(cs => cs.courseId);
    filtered = filtered.filter(c => courseIdsWithSkill.includes(c.id));
  }

  if (search) {
    const term = (search as string).toLowerCase();
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(term) || 
      c.description.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term)
    );
  }

  const enriched = filtered.map(course => {
    const trainer = db.users.find(u => u.id === course.trainerId);
    const skills = db.courseSkills
      .filter(cs => cs.courseId === course.id)
      .map(cs => {
        const skill = db.skills.find(s => s.id === cs.skillId);
        return {
          id: cs.skillId,
          name: skill?.name || '',
          targetLevel: cs.targetLevel
        };
      });
    const moduleCount = db.courseModules.filter(m => m.courseId === course.id).length;
    const enrollmentCount = db.enrollments.filter(e => e.courseId === course.id).length;

    return {
      ...course,
      trainerName: trainer?.name || 'SkillBridge Faculty',
      skills,
      moduleCount,
      enrollmentCount
    };
  });

  return res.json({ courses: enriched });
});

// GET /api/courses/:id - Course detail
courseRouter.get('/:id', (req: Request, res: Response) => {
  const db = database.db;
  const course = db.courses.find(c => c.id === req.params.id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const trainer = db.users.find(u => u.id === course.trainerId);
  const skills = db.courseSkills
    .filter(cs => cs.courseId === course.id)
    .map(cs => {
      const skill = db.skills.find(s => s.id === cs.skillId);
      return {
        id: cs.skillId,
        name: skill?.name || '',
        description: skill?.description || '',
        category: skill?.category || '',
        targetLevel: cs.targetLevel
      };
    });

  const modules = db.courseModules
    .filter(m => m.courseId === course.id)
    .sort((a, b) => a.order - b.order)
    .map(module => {
      const resources = db.learningResources.filter(r => r.moduleId === module.id);
      return {
        ...module,
        resources
      };
    });

  const quiz = db.quizzes.find(q => q.courseId === course.id);

  // Check optional auth token for user enrollment status & progress
  let userProgress = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Decoded user if available
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        const enrollment = db.enrollments.find(e => e.userId === decoded.userId && e.courseId === course.id);
        const completedModuleIds = db.lessonProgress
          .filter(lp => lp.userId === decoded.userId && lp.completed)
          .map(lp => lp.moduleId);
        
        const quizAttempt = quiz ? db.quizAttempts.find(qa => qa.quizId === quiz.id && qa.userId === decoded.userId) : null;
        const cert = db.certificates.find(c => c.userId === decoded.userId && c.courseId === course.id);

        userProgress = {
          isEnrolled: !!enrollment,
          enrollmentStatus: enrollment?.status,
          enrolledAt: enrollment?.enrolledAt,
          completedModuleIds,
          progressPercentage: modules.length > 0 ? Math.round((modules.filter(m => completedModuleIds.includes(m.id)).length / modules.length) * 100) : 0,
          quizAttempt,
          certificate: cert
        };
      }
    } catch {
      // Ignore token parse error for public view
    }
  }

  return res.json({
    course: {
      ...course,
      trainer: {
        id: trainer?.id,
        name: trainer?.name || 'SkillBridge Faculty',
        department: trainer?.department,
        organization: trainer?.organization,
        profileImage: trainer?.profileImage
      },
      skills,
      modules,
      quiz: quiz ? {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questionCount: db.quizQuestions.filter(q => q.quizId === quiz.id).length
      } : null,
      userProgress
    }
  });
});

// POST /api/courses/:id/enroll
courseRouter.post('/:id/enroll', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;
  const courseId = req.params.id;

  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const existing = db.enrollments.find(e => e.userId === userId && e.courseId === courseId);
  if (existing) {
    return res.json({ message: 'Already enrolled', enrollment: existing });
  }

  const now = new Date().toISOString();
  const enrollment = {
    id: `enr-${Date.now()}`,
    userId,
    courseId,
    enrolledAt: now,
    status: 'IN_PROGRESS' as const
  };

  db.enrollments.push(enrollment);

  // Add notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: `Enrolled: ${course.title}`,
    message: `You successfully enrolled in ${course.title}. Start learning the modules to advance your skills!`,
    type: 'ENROLLMENT',
    isRead: false,
    createdAt: now
  });

  database.save();

  return res.status(201).json({
    message: `Successfully enrolled in ${course.title}`,
    enrollment
  });
});

// POST /api/modules/:id/complete - Mark lesson complete and calculate real progress
courseRouter.post('/modules/:id/complete', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;
  const moduleId = req.params.id;

  const module = db.courseModules.find(m => m.id === moduleId);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }

  const course = db.courses.find(c => c.id === module.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Ensure enrollment exists
  let enrollment = db.enrollments.find(e => e.userId === userId && e.courseId === course.id);
  const now = new Date().toISOString();
  if (!enrollment) {
    enrollment = {
      id: `enr-${Date.now()}`,
      userId,
      courseId: course.id,
      enrolledAt: now,
      status: 'IN_PROGRESS'
    };
    db.enrollments.push(enrollment);
  }

  let progress = db.lessonProgress.find(lp => lp.userId === userId && lp.moduleId === moduleId);
  if (progress) {
    progress.completed = true;
    progress.completedAt = now;
  } else {
    progress = {
      id: `prog-${Date.now()}`,
      userId,
      moduleId,
      completed: true,
      completedAt: now
    };
    db.lessonProgress.push(progress);
  }

  // Recalculate course overall progress
  const allModules = db.courseModules.filter(m => m.courseId === course.id);
  const completedModules = allModules.filter(m => 
    db.lessonProgress.some(lp => lp.userId === userId && lp.moduleId === m.id && lp.completed)
  );

  const progressPercentage = Math.round((completedModules.length / allModules.length) * 100);

  database.save();

  return res.json({
    message: `Module "${module.title}" marked as complete!`,
    moduleId,
    completed: true,
    progressPercentage,
    completedModulesCount: completedModules.length,
    totalModulesCount: allModules.length
  });
});

// GET /api/enrollments - User's active & completed enrollments
courseRouter.get('/user/enrollments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;

  const userEnrollments = db.enrollments.filter(e => e.userId === userId);

  const enriched = userEnrollments.map(enr => {
    const course = db.courses.find(c => c.id === enr.courseId);
    const modules = db.courseModules.filter(m => m.courseId === enr.courseId);
    const completedCount = modules.filter(m =>
      db.lessonProgress.some(lp => lp.userId === userId && lp.moduleId === m.id && lp.completed)
    ).length;

    const progressPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
    const cert = db.certificates.find(c => c.userId === userId && c.courseId === enr.courseId);

    return {
      enrollmentId: enr.id,
      courseId: enr.courseId,
      title: course?.title || 'Unknown Course',
      thumbnail: course?.thumbnail || '',
      category: course?.category || '',
      difficulty: course?.difficulty || 'BEGINNER',
      duration: course?.duration || '',
      enrolledAt: enr.enrolledAt,
      completedAt: enr.completedAt,
      status: enr.status,
      completedModulesCount: completedCount,
      totalModulesCount: modules.length,
      progressPercentage,
      certificateId: cert?.id,
      certificateNumber: cert?.certificateNumber
    };
  });

  return res.json({ enrollments: enriched });
});

// GET /api/certificates - User's certificates
courseRouter.get('/user/certificates', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;
  const user = db.users.find(u => u.id === userId);

  const certs = db.certificates
    .filter(c => c.userId === userId)
    .map(cert => {
      const course = db.courses.find(c => c.id === cert.courseId);
      return {
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        score: cert.score,
        issuedAt: cert.issuedAt,
        courseId: cert.courseId,
        courseTitle: course?.title || 'Course of Study',
        category: course?.category || 'Technology',
        recipientName: user?.name || 'Learner',
        organization: user?.organization || 'National Digital Academy'
      };
    });

  return res.json({ certificates: certs });
});

// GET /api/certificates/:id - Verifiable certificate public endpoint
courseRouter.get('/certificates/:id', (req: Request, res: Response) => {
  const db = database.db;
  const cert = db.certificates.find(c => c.id === req.params.id || c.certificateNumber === req.params.id);

  if (!cert) {
    return res.status(404).json({ error: 'Certificate record not found or invalid ID' });
  }

  const user = db.users.find(u => u.id === cert.userId);
  const course = db.courses.find(c => c.id === cert.courseId);
  const trainer = course ? db.users.find(u => u.id === course.trainerId) : null;

  return res.json({
    certificate: {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      score: cert.score,
      issuedAt: cert.issuedAt,
      recipientName: user?.name || 'Learner',
      recipientEmail: user?.email,
      department: user?.department,
      organization: user?.organization || 'National Digital Academy',
      courseTitle: course?.title,
      courseDescription: course?.description,
      category: course?.category,
      difficulty: course?.difficulty,
      duration: course?.duration,
      trainerName: trainer?.name || 'Senior Instructor',
      isVerified: true
    }
  });
});
