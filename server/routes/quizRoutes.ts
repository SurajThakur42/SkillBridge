import { Router, Request, Response } from 'express';
import { database } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { SkillEngine } from '../services/skillEngine.js';

export const quizRouter = Router();

// GET /api/quizzes/:id - Get Quiz and Questions (Safe for taking assessment)
quizRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;
  const quiz = db.quizzes.find(q => q.id === req.params.id);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const course = db.courses.find(c => c.id === quiz.courseId);
  const questions = db.quizQuestions
    .filter(q => q.quizId === quiz.id)
    .map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      marks: q.marks
      // Note: correctAnswer & explanation hidden during assessment taking
    }));

  const lastAttempt = db.quizAttempts
    .filter(qa => qa.quizId === quiz.id && qa.userId === userId)
    .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())[0];

  return res.json({
    quiz: {
      id: quiz.id,
      courseId: quiz.courseId,
      courseTitle: course?.title,
      title: quiz.title,
      passingScore: quiz.passingScore,
      totalQuestions: questions.length,
      questions,
      lastAttempt: lastAttempt ? {
        score: lastAttempt.score,
        percentage: lastAttempt.percentage,
        passed: lastAttempt.passed,
        attemptedAt: lastAttempt.attemptedAt
      } : null
    }
  });
});

// POST /api/quizzes/:id/submit - Real evaluation and competency update
quizRouter.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userId = req.user?.userId!;
  const { answers } = req.body; // Record<string, number> or Array of question answers

  const quiz = db.quizzes.find(q => q.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const questions = db.quizQuestions.filter(q => q.quizId === quiz.id);
  if (questions.length === 0) {
    return res.status(400).json({ error: 'Quiz has no active questions' });
  }

  let totalMarks = 0;
  let earnedMarks = 0;
  const resultsBreakdown: any[] = [];

  questions.forEach((q, idx) => {
    totalMarks += q.marks;
    const userAnswerIndex = Array.isArray(answers) ? answers[idx] : answers?.[q.id];
    const isCorrect = userAnswerIndex === q.correctAnswer;

    if (isCorrect) {
      earnedMarks += q.marks;
    }

    resultsBreakdown.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      userAnswer: userAnswerIndex,
      correctAnswer: q.correctAnswer,
      isCorrect,
      marks: isCorrect ? q.marks : 0,
      totalMarks: q.marks,
      explanation: q.explanation || 'Verified standard answer.'
    });
  });

  const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
  const passed = percentage >= quiz.passingScore;
  const now = new Date().toISOString();

  // Record attempt
  const attempt = {
    id: `att-${Date.now()}`,
    quizId: quiz.id,
    userId,
    score: earnedMarks,
    percentage,
    passed,
    attemptedAt: now
  };
  db.quizAttempts.push(attempt);

  // Trigger Competency update engine
  SkillEngine.updateCompetencyFromQuiz(userId, quiz.id, percentage);

  // Add notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: passed ? `Quiz Passed: ${quiz.title}` : `Assessment Attempted: ${quiz.title}`,
    message: passed 
      ? `Outstanding! You scored ${percentage}% (Passing is ${quiz.passingScore}%). Your competency profile and skill gaps have been updated!`
      : `You scored ${percentage}% on ${quiz.title}. Review the module materials and attempt again to achieve the ${quiz.passingScore}% threshold.`,
    type: 'QUIZ',
    isRead: false,
    createdAt: now
  });

  database.save();

  // Return fresh skill gap & updated metrics immediately
  const updatedGap = SkillEngine.getSkillGapAnalysis(userId);
  const updatedRecs = SkillEngine.getRecommendations(userId);

  return res.json({
    attemptId: attempt.id,
    score: earnedMarks,
    totalMarks,
    percentage,
    passingScore: quiz.passingScore,
    passed,
    resultsBreakdown,
    updatedCompetencies: {
      overallReadinessPercentage: updatedGap.overallReadinessPercentage,
      criticalGapsCount: updatedGap.criticalGapsCount,
      matchedCount: updatedGap.matchedCount
    },
    newRecommendations: updatedRecs.slice(0, 3)
  });
});
