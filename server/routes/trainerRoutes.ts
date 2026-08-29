import { Router, Response } from 'express';
import { database } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const trainerRouter = Router();

// Apply authentication middleware
trainerRouter.use(authenticate);

// GET /api/trainer/dashboard - Metrics and courses created by this trainer
trainerRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const trainerId = req.user?.userId!;

  const trainerCourses = req.user?.role === 'ADMIN' 
    ? db.courses 
    : db.courses.filter(c => c.trainerId === trainerId);

  const courseIds = trainerCourses.map(c => c.id);
  const enrollments = db.enrollments.filter(e => courseIds.includes(e.courseId));
  const uniqueLearnerIds = Array.from(new Set(enrollments.map(e => e.userId)));
  
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const avgCompletionRate = enrollments.length > 0 
    ? Math.round((completedEnrollments.length / enrollments.length) * 100) 
    : 0;

  // Average quiz score
  const quizIds = db.quizzes.filter(q => courseIds.includes(q.courseId)).map(q => q.id);
  const attempts = db.quizAttempts.filter(qa => quizIds.includes(qa.quizId));
  const avgQuizScore = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length)
    : 0;

  const coursesWithDetails = trainerCourses.map(course => {
    const courseEnrollments = db.enrollments.filter(e => e.courseId === course.id);
    const courseCompletions = courseEnrollments.filter(e => e.status === 'COMPLETED');
    const courseQuiz = db.quizzes.find(q => q.courseId === course.id);
    const courseAttempts = courseQuiz ? db.quizAttempts.filter(qa => qa.quizId === courseQuiz.id) : [];
    const avgScore = courseAttempts.length > 0
      ? Math.round(courseAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / courseAttempts.length)
      : 0;

    return {
      ...course,
      enrollmentsCount: courseEnrollments.length,
      completionsCount: courseCompletions.length,
      completionRate: courseEnrollments.length > 0 ? Math.round((courseCompletions.length / courseEnrollments.length) * 100) : 0,
      averageQuizScore: avgScore,
      modulesCount: db.courseModules.filter(m => m.courseId === course.id).length
    };
  });

  return res.json({
    metrics: {
      coursesCreated: trainerCourses.length,
      totalLearners: uniqueLearnerIds.length,
      totalEnrollments: enrollments.length,
      averageCompletionRate: avgCompletionRate,
      averageQuizScore: avgQuizScore
    },
    courses: coursesWithDetails
  });
});

// POST /api/trainer/courses - Create course with modules and quiz
trainerRouter.post('/courses', requireRole('TRAINER', 'ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, difficulty, duration, thumbnail, skillIds, modules, quiz } = req.body;
  const db = database.db;
  const trainerId = req.user?.userId!;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required' });
  }

  const now = new Date().toISOString();
  const courseId = `crs-${Date.now()}`;

  const newCourse = {
    id: courseId,
    title,
    description,
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    category,
    difficulty: difficulty || 'BEGINNER',
    duration: duration || '3.5 Hours',
    status: 'PUBLISHED' as const,
    trainerId,
    createdAt: now,
    updatedAt: now
  };

  db.courses.push(newCourse);

  // Link Skills
  if (Array.isArray(skillIds)) {
    for (const sId of skillIds) {
      db.courseSkills.push({
        courseId,
        skillId: sId,
        targetLevel: 'ADVANCED'
      });
    }
  }

  // Create Modules if provided
  if (Array.isArray(modules) && modules.length > 0) {
    modules.forEach((mod: any, idx: number) => {
      const modId = `mod-${Date.now()}-${idx}`;
      db.courseModules.push({
        id: modId,
        courseId,
        title: mod.title || `Module ${idx + 1}`,
        description: mod.description || 'Module learning material',
        order: idx + 1
      });

      if (mod.content) {
        db.learningResources.push({
          id: `res-${Date.now()}-${idx}`,
          moduleId: modId,
          title: `${mod.title} - Core Guide`,
          type: 'ARTICLE',
          duration: '15 min read',
          content: mod.content
        });
      }
    });
  } else {
    // Default module
    const modId = `mod-${Date.now()}-1`;
    db.courseModules.push({
      id: modId,
      courseId,
      title: 'Module 1: Core Fundamentals & Practical Labs',
      description: 'Foundational theory and hands-on demonstrations.',
      order: 1
    });

    db.learningResources.push({
      id: `res-${Date.now()}-1`,
      moduleId: modId,
      title: 'Course Introduction & Learning Architecture',
      type: 'ARTICLE',
      duration: '15 min read',
      content: `## Welcome to ${title}\n\nThis course is structured to develop core competencies in ${category}. Work through the material and complete the final assessment to earn your credential.`
    });
  }

  // Create Quiz if provided
  if (quiz) {
    const quizId = `quiz-${Date.now()}`;
    db.quizzes.push({
      id: quizId,
      courseId,
      title: quiz.title || `${title} Assessment`,
      passingScore: quiz.passingScore || 70
    });

    if (Array.isArray(quiz.questions)) {
      quiz.questions.forEach((q: any, qIdx: number) => {
        db.quizQuestions.push({
          id: `q-${Date.now()}-${qIdx}`,
          quizId,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          marks: q.marks || 2,
          explanation: q.explanation || 'Correct solution verified.'
        });
      });
    }
  }

  database.save();

  return res.status(201).json({
    message: 'Course created and published successfully',
    course: newCourse
  });
});

// PUT /api/trainer/courses/:id - Edit course
trainerRouter.put('/courses/:id', (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, difficulty, duration, thumbnail, status } = req.body;
  const db = database.db;
  const course = db.courses.find(c => c.id === req.params.id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (req.user?.role !== 'ADMIN' && course.trainerId !== req.user?.userId) {
    return res.status(403).json({ error: 'Unauthorized to edit this course' });
  }

  if (title) course.title = title;
  if (description) course.description = description;
  if (category) course.category = category;
  if (difficulty) course.difficulty = difficulty;
  if (duration) course.duration = duration;
  if (thumbnail) course.thumbnail = thumbnail;
  if (status) course.status = status;
  course.updatedAt = new Date().toISOString();

  database.save();

  return res.json({
    message: 'Course updated successfully',
    course
  });
});

// GET /api/trainer/courses/:id/curriculum - Full curriculum details with modules, lessons, and quiz
trainerRouter.get('/courses/:id/curriculum', (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const course = db.courses.find(c => c.id === req.params.id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const modules = db.courseModules
    .filter(m => m.courseId === course.id)
    .sort((a, b) => a.order - b.order)
    .map(m => ({
      ...m,
      resources: db.learningResources.filter(r => r.moduleId === m.id)
    }));

  const quiz = db.quizzes.find(q => q.courseId === course.id);
  const quizWithQuestions = quiz ? {
    ...quiz,
    questions: db.quizQuestions.filter(q => q.quizId === quiz.id)
  } : null;

  return res.json({
    course,
    modules,
    quiz: quizWithQuestions
  });
});

// DELETE /api/trainer/courses/:id - Delete a course
trainerRouter.delete('/courses/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const courseIndex = db.courses.findIndex(c => c.id === req.params.id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const course = db.courses[courseIndex];
  if (req.user?.role !== 'ADMIN' && course.trainerId !== req.user?.userId) {
    return res.status(403).json({ error: 'Unauthorized to delete this course' });
  }

  db.courses.splice(courseIndex, 1);
  database.save();

  return res.json({ message: 'Course deleted successfully' });
});

// GET /api/trainer/learners - View enrolled learners & their progress across trainer courses
trainerRouter.get('/learners', (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const trainerId = req.user?.userId!;

  const trainerCourseIds = req.user?.role === 'ADMIN'
    ? db.courses.map(c => c.id)
    : db.courses.filter(c => c.trainerId === trainerId).map(c => c.id);

  const enrollments = db.enrollments.filter(e => trainerCourseIds.includes(e.courseId));

  const learnerMap = new Map<string, any>();

  for (const enr of enrollments) {
    const user = db.users.find(u => u.id === enr.userId);
    const course = db.courses.find(c => c.id === enr.courseId);
    if (!user || !course) continue;

    const modules = db.courseModules.filter(m => m.courseId === course.id);
    const completedCount = modules.filter(m =>
      db.lessonProgress.some(lp => lp.userId === user.id && lp.moduleId === m.id && lp.completed)
    ).length;
    const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

    const quiz = db.quizzes.find(q => q.courseId === course.id);
    const attempt = quiz ? db.quizAttempts.find(qa => qa.quizId === quiz.id && qa.userId === user.id) : null;

    if (!learnerMap.has(user.id)) {
      learnerMap.set(user.id, {
        userId: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        organization: user.organization,
        profileImage: user.profileImage,
        enrolledCourses: []
      });
    }

    learnerMap.get(user.id).enrolledCourses.push({
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: enr.enrolledAt,
      status: enr.status,
      progress,
      quizScore: attempt ? attempt.percentage : null
    });
  }

  return res.json({
    learners: Array.from(learnerMap.values())
  });
});
