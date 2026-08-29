import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/authRoutes.js';
import { userRouter } from './server/routes/userRoutes.js';
import { courseRouter } from './server/routes/courseRoutes.js';
import { quizRouter } from './server/routes/quizRoutes.js';
import { skillRouter } from './server/routes/skillRoutes.js';
import { trainerRouter } from './server/routes/trainerRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { aiRouter } from './server/routes/aiRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware with audio upload capacity
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger in dev
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      platform: 'SkillBridge',
      version: '1.0.0 (SIH 2026)',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/skills', skillRouter);
  app.use('/api/trainer', trainerRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai', aiRouter);

  // Global API error handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`SkillBridge (SIH 2026) Server Active`);
    console.log(`Listening on http://0.0.0.0:${PORT}`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
