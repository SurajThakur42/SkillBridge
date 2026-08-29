import { Router, Response } from 'express';
import { database } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const adminRouter = Router();

// Restrict all routes in this router to ADMIN
adminRouter.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/dashboard - Complete organization dynamic statistics
adminRouter.get('/dashboard', (_req: AuthenticatedRequest, res: Response) => {
  const db = database.db;

  const totalUsers = db.users.length;
  const learners = db.users.filter(u => u.role === 'LEARNER');
  const trainers = db.users.filter(u => u.role === 'TRAINER');
  const activeLearners = learners.filter(u => u.isActive);
  const courses = db.courses;
  const enrollments = db.enrollments;
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
  const certificates = db.certificates;
  const quizAttempts = db.quizAttempts;

  const overallCompletionRate = enrollments.length > 0
    ? Math.round((completedEnrollments.length / enrollments.length) * 100)
    : 0;

  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / quizAttempts.length)
    : 0;

  // Category breakdown
  const categoryStats: Record<string, { courses: number; enrollments: number; completions: number }> = {};
  for (const course of courses) {
    if (!categoryStats[course.category]) {
      categoryStats[course.category] = { courses: 0, enrollments: 0, completions: 0 };
    }
    categoryStats[course.category].courses++;
    const courseEnrs = enrollments.filter(e => e.courseId === course.id);
    categoryStats[course.category].enrollments += courseEnrs.length;
    categoryStats[course.category].completions += courseEnrs.filter(e => e.status === 'COMPLETED').length;
  }

  // Competency level distribution across organization
  const competencyDist = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
    EXPERT: 0
  };
  for (const us of db.userSkills) {
    if (competencyDist[us.competencyLevel] !== undefined) {
      competencyDist[us.competencyLevel]++;
    }
  }

  // Target role distribution
  const targetRoleDist: Record<string, number> = {};
  for (const role of db.targetRoles) {
    targetRoleDist[role.name] = learners.filter(l => l.targetRoleId === role.id).length;
  }

  // Top skill gaps across the organization
  const skillGapFrequency: Record<string, { count: number; name: string; avgScore: number; scores: number[] }> = {};
  for (const skill of db.skills) {
    skillGapFrequency[skill.id] = { count: 0, name: skill.name, avgScore: 0, scores: [] };
  }

  for (const us of db.userSkills) {
    if (us.score < 60) {
      if (skillGapFrequency[us.skillId]) {
        skillGapFrequency[us.skillId].count++;
        skillGapFrequency[us.skillId].scores.push(us.score);
      }
    }
  }

  const topOrganizationalGaps = Object.values(skillGapFrequency)
    .filter(g => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(g => ({
      skillName: g.name,
      learnersWithGap: g.count,
      averageScore: g.scores.length > 0 ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length) : 0
    }));

  return res.json({
    metrics: {
      totalUsers,
      learnersCount: learners.length,
      activeLearnersCount: activeLearners.length,
      trainersCount: trainers.length,
      coursesCount: courses.length,
      enrollmentsCount: enrollments.length,
      completionsCount: completedEnrollments.length,
      certificatesCount: certificates.length,
      overallCompletionRate,
      averageQuizScore: avgQuizScore
    },
    categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      ...stats
    })),
    competencyDistribution: [
      { level: 'Beginner (0-39%)', count: competencyDist.BEGINNER, fill: '#ef4444' },
      { level: 'Intermediate (40-69%)', count: competencyDist.INTERMEDIATE, fill: '#f59e0b' },
      { level: 'Advanced (70-89%)', count: competencyDist.ADVANCED, fill: '#3b82f6' },
      { level: 'Expert (90-100%)', count: competencyDist.EXPERT, fill: '#10b981' }
    ],
    targetRoleDistribution: Object.entries(targetRoleDist).map(([role, count]) => ({ role, count })),
    topOrganizationalGaps,
    recentCertificates: certificates.slice(-5).reverse().map(cert => {
      const u = db.users.find(usr => usr.id === cert.userId);
      const c = db.courses.find(crs => crs.id === cert.courseId);
      return {
        certificateNumber: cert.certificateNumber,
        learnerName: u?.name || 'Learner',
        courseTitle: c?.title || 'Course',
        score: cert.score,
        issuedAt: cert.issuedAt
      };
    })
  });
});

// GET /api/admin/users - User management with search and filters
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { role, search, department } = req.query;
  const db = database.db;

  let users = db.users;

  if (role && role !== 'ALL') {
    users = users.filter(u => u.role === (role as string));
  }

  if (department && department !== 'ALL') {
    users = users.filter(u => u.department.toLowerCase() === (department as string).toLowerCase());
  }

  if (search) {
    const term = (search as string).toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.organization.toLowerCase().includes(term) ||
      u.department.toLowerCase().includes(term)
    );
  }

  const enriched = users.map(user => {
    const targetRole = db.targetRoles.find(r => r.id === user.targetRoleId);
    const enrollmentsCount = db.enrollments.filter(e => e.userId === user.id).length;
    const completedCount = db.enrollments.filter(e => e.userId === user.id && e.status === 'COMPLETED').length;
    const certsCount = db.certificates.filter(c => c.userId === user.id).length;

    const { passwordHash: _, ...safeUser } = user;
    return {
      ...safeUser,
      targetRoleName: targetRole?.name || 'None Selected',
      stats: {
        enrollmentsCount,
        completedCount,
        certsCount
      }
    };
  });

  return res.json({ users: enriched });
});

// PUT /api/admin/users/:id/status - Activate or Deactivate user
adminRouter.put('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { isActive } = req.body;
  const db = database.db;
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent self-deactivation of current admin
  if (user.id === req.user?.userId && isActive === false) {
    return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
  }

  user.isActive = Boolean(isActive);
  user.updatedAt = new Date().toISOString();
  database.save();

  return res.json({
    message: `User ${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}.`,
    user: {
      id: user.id,
      name: user.name,
      isActive: user.isActive
    }
  });
});
