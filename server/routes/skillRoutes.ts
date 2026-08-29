import { Router, Request, Response } from 'express';
import { database } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { SkillEngine, scoreToCompetency } from '../services/skillEngine.js';

export const skillRouter = Router();

// GET /api/skills - List all skills in taxonomy
skillRouter.get('/', (_req: Request, res: Response) => {
  const db = database.db;
  return res.json({ skills: db.skills });
});

// GET /api/users/me/skills - Current user's skill competency breakdown
skillRouter.get('/user/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const skillProfile = SkillEngine.getUserSkillProfile(userId);

  return res.json({
    skills: skillProfile
  });
});

// GET /api/users/me/skill-gap - Comprehensive skill gap analysis vs target role
skillRouter.get('/user/gap-analysis', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const gapAnalysis = SkillEngine.getSkillGapAnalysis(userId);

  return res.json(gapAnalysis);
});

// GET /api/users/me/recommendations - Personalized course recommendations
skillRouter.get('/user/recommendations', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const recommendations = SkillEngine.getRecommendations(userId);

  return res.json({
    recommendations
  });
});

// GET /api/users/me/learning-path - Ordered step-by-step roadmap to role mastery
skillRouter.get('/user/learning-path', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const learningPath = SkillEngine.getLearningPath(userId);

  return res.json(learningPath);
});

// POST /api/skills/calibrate - Manually calibrate/update skill (useful for testing or initial self-assessment)
skillRouter.post('/user/calibrate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const { skillId, score } = req.body;

  if (!skillId || typeof score !== 'number') {
    return res.status(400).json({ error: 'skillId and numeric score (0-100) are required' });
  }

  const db = database.db;
  const skill = db.skills.find(s => s.id === skillId);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const now = new Date().toISOString();

  let userSkill = db.userSkills.find(us => us.userId === userId && us.skillId === skillId);
  if (userSkill) {
    userSkill.score = clampedScore;
    userSkill.competencyLevel = scoreToCompetency(clampedScore);
    userSkill.lastAssessedAt = now;
  } else {
    userSkill = {
      userId,
      skillId,
      score: clampedScore,
      competencyLevel: scoreToCompetency(clampedScore),
      lastAssessedAt: now
    };
    db.userSkills.push(userSkill);
  }

  database.save();

  const gapAnalysis = SkillEngine.getSkillGapAnalysis(userId);
  const recommendations = SkillEngine.getRecommendations(userId);

  return res.json({
    message: `Calibrated ${skill.name} competency to ${clampedScore}%`,
    userSkill,
    gapAnalysis,
    recommendations
  });
});
